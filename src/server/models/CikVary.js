/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

/**
 * Represents the CikVary conversion model for time-varying conversions.
 * Each conversion has a time range (start_time, end_time).
 */
class CikVary {
	/**
	* @param {*} meterUnitId The id of the meter unit.  
	* @param {*} nonMeterUnitId The id of the non meter unit.
	* @param {*} startTime The start time of the conversion validity.
	* @param {*} endTime The end time of the conversion validity.
	* @param {*} slope The slope of the conversion.
	* @param {*} intercept The intercept of the conversion.
	*/
	constructor(meterUnitId, nonMeterUnitId, startTime, endTime, slope, intercept) {
		this.meterUnitId = meterUnitId;
		this.nonMeterUnitId = nonMeterUnitId;
		this.startTime = startTime;
		this.endTime = endTime;
		this.slope = slope;
		this.intercept = intercept;
	}

	/**
	* Returns a promise to create the cik_vary table.
	* @param {*} conn The connection to use.
	* @returns {Promise}
	*/
	static createTable(conn) {
		return conn.none(sqlFile('cik_vary/create_cik_vary_table.sql'));
	}

	/**
	* Create a new CikVary object from row's data.
	* @param {*} row The row from which CikVary will be created.
	* @returns the created CikVary object
	*/
	static mapRow(row) {
		return new CikVary(
			row.meter_unit_id || row.source_id,
			row.non_meter_unit_id || row.destination_id,
			row.start_time,
			row.end_time,
			row.slope,
			row.intercept
		);
	}

	/**
	* Get all CikVary objects
	* @param {*} conn The database connection to use.
	* @returns all CikVary objects
	*/
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('cik_vary/get_all_cik_vary.sql'));
		return rows.map(CikVary.mapRow);
	}

	/**
	* Get CikVary conversions rate at a specific time.
	* @param {*} conn The database connection to use.
	* @param {*} sourceId Source unit id.
	* @param {*} destinationId Destination unit id.
	* @param {*} queryTime Timestamp to check validity.
	* @returns Matching CikVary objects
	*/
	// TODO: Research whether this lookup is used by external consumers. It has
	// no in-repository callers and references a misspelled/nonexistent SQL path;
	// remove the method and its unused SQL file if no supported caller needs it.
	static async getBySourceDestinationStartEnd(conn, sourceId, destinationId, queryTime) {
		const rows = await conn.any(sqlFile('cik_vary/get_cik_vart_by_source_destination_start_end.sql'), {
			sourceId,
			destinationId,
			queryTime
		});
		return rows.map(CikVary.mapRow);
	}

	/**
	* Inserts each element of the array with an actual time-varying conversion into the cik_vary table.
	* The current values in the table are removed first.
	* @param {*} cikVaryArr Array of time-varying conversions.
	* @param {*} conn The database connection to use.
	*/
	static async insert(cikVaryArr, conn) {
		return conn.tx(async t => {
			// cik_vary
			// Remove all the current values in the table.
			await t.none(sqlFile('cik_vary/delete_all_cik_vary.sql'));
			// Insert all time-varying conversions in one database statement.
			// jsonb_to_recordset preserves the existing typed insert behavior while
			// avoiding one application/database round trip per conversion segment.
			await t.none(`
				INSERT INTO cik_vary (
					source_id,
					destination_id,
					start_time,
					end_time,
					slope,
					intercept
				)
				SELECT
					conversion.source_id,
					conversion.destination_id,
					conversion.start_time,
					conversion.end_time,
					conversion.slope,
					conversion.intercept
				FROM jsonb_to_recordset(\${conversions:json}::jsonb) AS conversion(
					source_id INTEGER,
					destination_id INTEGER,
					start_time TIMESTAMP,
					end_time TIMESTAMP,
					slope FLOAT,
					intercept FLOAT
				)
			`, {
				conversions: cikVaryArr.map(conversion => ({
					source_id: conversion.source,
					destination_id: conversion.destination,
					start_time: conversion.start_time,
					end_time: conversion.end_time,
					slope: conversion.slope,
					intercept: conversion.intercept
				}))
			});

			// cik
			// Remove all the current values in the table.
			await t.none(sqlFile('cik/delete_all_cik.sql'));
			// The following finds each unique (by source/i and destination/k) entry in cik_vary and then
			// inserts and entry in cik. Done as one sql call to be more efficient.
			// It is also possible to create the needed information during createCikVaryArray for each source
			// and destination. That might be a little more efficient but this way is simple and guarantees
			// that cik_vary and cik represent the same information.
			await t.none(sqlFile('cik/insert_unique_cik_vary_in_cik.sql'));

			// Existing hourly split rows retain the conversion metadata that was
			// current when they were created. Group graphic-unit compatibility also
			// depends on cik. Mark both derived datasets stale in the same transaction
			// as the cik_vary and cik replacement.
			await t.none(`
				UPDATE reading_aggregate_state
				SET rebuild_revision = rebuild_revision + 1,
					group_cache_revision = group_cache_revision + 1
				WHERE id = 1
			`);
		});
	}
}

module.exports = CikVary;
