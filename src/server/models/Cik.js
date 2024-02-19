/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

/**
 * Represents the Cik conversion model.
 * @see src/server/services/graph/createConversionArrays.js for details on Cik array.
 * [0]: is slope, [1]: is intercept, [2]: is not used here.
 */
class Cik {
	/**
	 * @param {*} meterUnitId The id of the meter unit.
	 * @param {*} nonMeterUnitId The id of the non meter unit.
	 * @param {*} slope The slope of the conversion.
	 * @param {*} intercept The intercept of the conversion.
	 */
	constructor(meterUnitId, nonMeterUnitId, slope, intercept) {
		this.meterUnitId = meterUnitId;
		this.nonMeterUnitId = nonMeterUnitId;
		this.slope = slope;
		this.intercept = intercept;
	}

	/**
	 * Returns a promise to create the cik table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('cik/create_cik_table.sql'));
	}

	/**
	 * Create a new Cik object from row's data.
	 * @param {*} row The row from which Cik will be created.
	 * @returns the created Cik object
	 */
	static mapRow(row) {
		return new Cik(row.meter_unit_id, row.non_meter_unit_id, row.slope, row.intercept);
	}

	/**
	 * Get all Cik objects
	 * @param {*} conn The database connection to use.
	 * @returns all Cik objects
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('cik/get_cik.sql'));
		return rows.map(Cik.mapRow);
	}

	/**
	 * Inserts each element of the array with an actual conversion into the cik table.
	 * The current values in the table are removed first.
	 * @param {*} cik is the OED conversion array from the graph.
	 * @param {*} conn The database connection to use.
	 */
	static async insert(cik, conn) {
		// TODO This should be a transaction to avoid issues for any request made to the database.

		// Remove all the current values in the table.
		await conn.none(sqlFile('cik/delete_all_conversions.sql'));

		// Loop over all conversions in cik array and insert each in DB.
		cik.forEach(async (conversion) => {
			await conn.none(sqlFile('cik/insert_new_conversion.sql'), {
				sourceId: conversion.source,
				destinationId: conversion.destination,
				slope: conversion.slope,
				intercept: conversion.intercept
			});
		});
	}
}

module.exports = Cik;
