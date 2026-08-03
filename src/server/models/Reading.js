/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const { mapToObject, threeDHoleAlgorithm } = require('../util');
const determineMaxPoints = require('../util/determineMaxPoints');
const log = require('../log');

const sqlFile = database.sqlFile;

// Keep each statement bounded so large CSV and meter imports avoid both
// per-reading round trips and excessively large PostgreSQL query parameters.
const READING_INSERT_BATCH_SIZE = 1000;

class Reading {
	/**
	 * Creates a new reading
	 * @param meterID
	 * @param reading
	 * @param {Moment} startTimestamp
	 * @param {Moment} endTimestamp
	 */
	constructor(meterID, reading, startTimestamp, endTimestamp) {
		this.meterID = meterID;
		this.reading = reading;
		this.startTimestamp = startTimestamp;
		this.endTimestamp = endTimestamp;
	}

	/**
	 * Returns a promise to create the readings table.
	 * @param conn the database connection to use
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('reading/create_readings_table.sql'));
	}

	/**
	 * @deprecated Retained for the legacy PostgreSQL materialized-view schema.
	 */
	// TODO: Research whether deployments or external scripts still invoke the
	// legacy schema helpers below. Their in-repository setup calls are commented
	// out; remove the helpers and legacy SQL once TimescaleDB is the only schema.
	static createReadingsMaterializedViews(conn) {
		return conn.none(sqlFile('reading/create_reading_views.sql'));
	}

	/**
	 * @deprecated Retained for the legacy PostgreSQL materialized-view schema.
	 */
	static createCompareReadingsFunction(conn) {
		return conn.none(sqlFile('reading/create_function_get_compare_readings.sql'));
	}

	/**
	 * Returns a promise to create the reading_line_accuracy type.
	 * This needs to be run before Reading.createTable().
	 * @param conn the connection to use
	 * @return {Promise<void>}
	 */
	static createReadingLineAccuracyEnum(conn) {
		return conn.none(sqlFile('reading/create_reading_line_accuracy_enum.sql'));
	}

	/**
	 * @deprecated Retained for the legacy PostgreSQL materialized-view schema.
	 */
	static create3DReadingsFunction(conn) {
		return conn.none(sqlFile('reading/create_function_get_3d_readings.sql'));
	}

	/**
	 * @deprecated Use TimeScaleDBReading.refreshReadings().
	 */
	static refreshHourlyReadings(conn) {
		// TODO: Remove the retained legacy implementation once the hypertable implementation is finalized:
		// return conn.none('REFRESH MATERIALIZED VIEW meter_hourly_readings_unit');
		// Required lazily to avoid a circular dependency through database.js.
		// eslint-disable-next-line global-require
		return require('./TimeScaleDB/Reading').refreshMeterHourlyReadings(conn);
	}

	/**
	 * @deprecated Use TimeScaleDBReading.refreshReadings().
	 */
	static refreshDailyReadings(conn) {
		// TODO: Remove the retained legacy implementation once the hypertable implementation is finalized:
		// return conn.none('REFRESH MATERIALIZED VIEW meter_daily_readings_unit');
		// Required lazily to avoid a circular dependency through database.js.
		// eslint-disable-next-line global-require
		return require('./TimeScaleDB/Reading').refreshMeterDailyReadings(conn);
	}

	/**
	 * @deprecated Use TimeScaleDBReading.refreshReadings().
	 */
	static refreshMeterReadingsViews(conn) {
		// TODO: Remove the retained legacy refreshes once the hypertable implementation is finalized:
		// await conn.none('REFRESH MATERIALIZED VIEW meter_hourly_readings_unit');
		// await conn.none('REFRESH MATERIALIZED VIEW meter_daily_readings_unit');
		// Required lazily to avoid a circular dependency through database.js.
		// eslint-disable-next-line global-require
		return require('./TimeScaleDB/Reading').refreshMeterReadings(conn);
	}

	/**
	 * @deprecated Use TimeScaleDBReading.refreshReadings().
	 */
	static refreshGroupReadingsViews(conn) {
		// TODO: Remove the retained legacy refreshes once the hypertable implementation is finalized:
		// return Promise.all([conn.none('REFRESH MATERIALIZED VIEW group_hourly_readings_unit'),
		// 	conn.none('REFRESH MATERIALIZED VIEW group_daily_readings_unit')]);
		// Required lazily to avoid a circular dependency through database.js.
		// eslint-disable-next-line global-require
		return require('./TimeScaleDB/Reading').refreshGroupReadings(conn);
	}

	/**
	 * Because moment allows modification of its values, this creates a new Reading where all the timestamps
	 * are cloned so they cannot change unless you modify this new one.
	 * 
	 * @returns a duplicate of the reading where the moment timestamps are cloned so cannot change.
	 */
	clone() {
		return new Reading(this.meterID, this.reading, this.startTimestamp.clone(), this.endTimestamp.clone());
	}

	/**
	 * Change a row from the readings table into a Reading object.
	 * @param row The row from the table to be changed.
	 * @returns Reading object from row
	 */
	static mapRow(row) {
		return new Reading(row.meter_id, row.reading, row.start_timestamp, row.end_timestamp);
	}

	/**
	 * Returns the number of readings which exist in the database, total.
	 * @param conn the connection to use
	 * @returns {number} the number of readings in the entire readings table
	 */
	static async count(conn) {
		const { count } = await conn.one('SELECT COUNT(*) as count FROM readings');
		return parseInt(count);
	}

	/**
	 * Returns a promise to insert all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static insertAll(readings, conn) {
		return Reading.insertInBatches(readings, conn);
	}

	/**
	 * Returns a promise to insert or update all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static insertOrUpdateAll(readings, conn) {
		/*
		 * Sequential upserts kept the first end timestamp but applied the last
		 * reading value when an input batch repeated a meter/start key. Collapse
		 * those duplicates before the set-based insert to preserve that behavior
		 * and avoid PostgreSQL updating the same row twice in one statement.
		 */
		const readingsByKey = new Map();
		for (const reading of readings) {
			const key = `${reading.meterID}:${reading.startTimestamp.valueOf()}`;
			const firstReading = readingsByKey.get(key);
			if (firstReading === undefined) {
				readingsByKey.set(key, reading);
			} else {
				readingsByKey.set(key, new Reading(
					firstReading.meterID,
					reading.reading,
					firstReading.startTimestamp,
					firstReading.endTimestamp
				));
			}
		}
		return Reading.insertInBatches(
			Array.from(readingsByKey.values()),
			conn,
			'ON CONFLICT (meter_id, start_timestamp) DO UPDATE SET reading = EXCLUDED.reading'
		);
	}

	/**
	 * Returns a promise to insert or ignore all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @param conn is the connection to use.
	 * @returns {Promise<any>}
	 */
	static insertOrIgnoreAll(readings, conn) {
		return Reading.insertInBatches(
			readings,
			conn,
			'ON CONFLICT (meter_id, start_timestamp) DO NOTHING'
		);
	}

	/**
	 * Inserts readings in set-based batches within one transaction.
	 * @param {array<Reading>} readings the readings to insert
	 * @param conn the connection to use
	 * @param {string} conflictClause fixed conflict behavior for the caller
	 * @returns {Promise<void>}
	 */
	static insertInBatches(readings, conn, conflictClause = '') {
		return conn.tx(async t => {
			for (let offset = 0; offset < readings.length; offset += READING_INSERT_BATCH_SIZE) {
				const batch = readings.slice(offset, offset + READING_INSERT_BATCH_SIZE);
				/*
				 * jsonb_to_recordset turns each chunk into typed rows inside
				 * PostgreSQL, replacing one application/database round trip per
				 * reading while still firing the existing maintenance trigger.
				 */
				await t.none(`
					INSERT INTO readings (meter_id, reading, start_timestamp, end_timestamp)
					SELECT
						input.meter_id,
						input.reading,
						input.start_timestamp,
						input.end_timestamp
					FROM jsonb_to_recordset(\${readings:json}::jsonb) AS input(
						meter_id INTEGER,
						reading FLOAT,
						start_timestamp TIMESTAMP,
						end_timestamp TIMESTAMP
					)
					${conflictClause}
				`, {
					readings: batch.map(reading => ({
						meter_id: reading.meterID,
						reading: reading.reading,
						start_timestamp: reading.startTimestamp,
						end_timestamp: reading.endTimestamp
					}))
				});
			}
		});
	}

	/**
	 * Returns the count(number of rows) for a meter
	 * @param meterID 
	 * @param conn 
	 */
	static async getCountByMeterIDAndDateRange(meterID, startDate, endDate, conn) {
		const row = await conn.any(sqlFile('reading/get_count_by_meter_id_and_date_range.sql'), {
			meterID: meterID,
			startDate: startDate,
			endDate: endDate
		});
		return parseInt(row[0].count);
	}

	/**
	 * Returns the total number of readings for all supplied meters in one query.
	 * @param {number[]} meterIDs meter IDs whose readings should be counted
	 * @param startDate inclusive reading start bound
	 * @param endDate inclusive reading end bound
	 * @param conn the connection to use
	 * @returns {number}
	 */
	static async getCountByMeterIDsAndDateRange(meterIDs, startDate, endDate, conn) {
		const { count } = await conn.one(sqlFile('reading/get_count_by_meter_ids_and_date_range.sql'), {
			meterIDs,
			startDate,
			endDate
		});
		return parseInt(count);
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param meterID The id of the meter to find readings for
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<Reading>>}
	 */
	static async getAllByMeterID(meterID, conn) {
		const rows = await conn.any(sqlFile('reading/get_all_readings_by_meter_id.sql'), { meterID: meterID });
		return rows.map(Reading.mapRow);
	}

	/**
	 * Returns a promise to get all of the readings (so raw) for this meter within (inclusive) a specified date range from the
	 * database. If no startDate is specified, all readings from the beginning of time to the endDate are returned.
	 * If no endDate is specified, all readings after and including the startDate are returned.
	 * @param meterID
	 * @param {Date} startDate
	 * @param {Date} endDate
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<Reading>>}
	 */
	static async getReadingsByMeterIDAndDateRange(meterID, startDate, endDate, conn) {
		const rows = await conn.any(sqlFile('reading/get_readings_by_meter_id_and_date_range.sql'), {
			meterID: meterID,
			startDate: startDate,
			endDate: endDate
		});
		// This does not do the usual row mapping because the identifiers are not the usual ones and there
		// is no meter id. All this is to make the data smaller.
		return rows;
	}

	/**
	 * Returns a promise to insert this reading into the database.
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	insert(conn) {
		return conn.none(sqlFile('reading/insert_new_reading.sql'), this);
	}

	/**
	 * Returns a promise to insert this reading into the database, or update it if it already exists.
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	insertOrUpdate(conn) {
		return conn.none(sqlFile('reading/insert_or_update_reading.sql'), this);
	}

	/**
	 * Returns a promise to insert this reading into the database, or ignore it if it already exists.
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	insertOrIgnore(conn) {
		return conn.none(sqlFile('reading/insert_or_ignore_reading.sql'), this);
	}

	/**
	 * Gets line readings for meters for the given time range
	 * @param meterIDs The meter IDs to get readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp An optional start point for the time range of readings returned
	 * @param toTimestamp An optional end point for the time range of readings returned
	 * @param conn the connection to use.
	 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	static async getMeterLineReadings(meterIDs, graphicUnitId, fromTimestamp = null, toTimestamp = null, conn) {
		const [maxRawPoints, maxHourlyPoints] = determineMaxPoints();
		/**
		 * @type {array<{meter_id: int, reading_rate: Number, max_rate: Number, min_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		 */
		const allMeterLineReadings = await conn.func('meter_line_readings_unit',
			[meterIDs, graphicUnitId, fromTimestamp || '-infinity', toTimestamp || 'infinity', 'auto', maxRawPoints, maxHourlyPoints]
		);
		const readingsByMeterID = mapToObject(meterIDs, () => []);
		for (const row of allMeterLineReadings) {
			readingsByMeterID[row.meter_id].push(
				{ reading_rate: row.reading_rate, min_rate: row.min_rate, max_rate: row.max_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return readingsByMeterID;
	}

	/**
	 * Gets line readings for groups for the given time range
	 * @param groupIDs The group IDs to get readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp An optional start point for the time range of readings returned
	 * @param toTimestamp An optional end point for the time range of readings returned
	 * @param conn the connection to use.
	 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	static async getGroupLineReadings(groupIDs, graphicUnitId, fromTimestamp, toTimestamp, conn) {
		// maxRawPoints is not used for groups.
		const [maxRawPoints, maxHourlyPoints] = determineMaxPoints();
		/**
		 * @type {array<{group_id: int, reading_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		 */
		const allGroupLineReadings = await conn.func('group_line_readings_unit',
			[groupIDs, graphicUnitId, fromTimestamp, toTimestamp, 'auto', maxHourlyPoints]
		);

		const readingsByGroupID = mapToObject(groupIDs, () => []);
		for (const row of allGroupLineReadings) {
			readingsByGroupID[row.group_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return readingsByGroupID;
	}

	/**
	 * Gets barchart readings for the given time range for the given meters
	 * @param meterIDs The meters to get barchart readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp The start of the barchart interval
	 * @param toTimestamp the end of the barchart interval
	 * @param barWidthDays the width of each bar in days
	 * @param conn the connection to use.
	 * @returns {Promise<object<int, array<{reading: number, start_timestamp: Moment, end_timestamp: Moment}>>>}
	 */
	static async getMeterBarReadings(meterIDs, graphicUnitId, fromTimestamp, toTimestamp, barWidthDays, conn) {
		const allBarReadings = await conn.func('meter_bar_readings_unit', [meterIDs, graphicUnitId, barWidthDays, fromTimestamp, toTimestamp]);
		const barReadingsByMeterID = mapToObject(meterIDs, () => []);
		for (const row of allBarReadings) {
			barReadingsByMeterID[row.meter_id].push(
				{ reading: row.reading, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return barReadingsByMeterID;
	}

	/**
	 * Gets barchart readings for the given time range for the given groups
	 * @param groupIDs The groups to get barchart readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp The start of the barchart interval
	 * @param toTimestamp the end of the barchart interval
	 * @param barWidthDays the width of each bar in days
	 * @param conn the connection to use.
	 * @returns {Promise<object<int, array<{reading: number, start_timestamp: Moment, end_timestamp: Moment}>>>}
	 */
	static async getGroupBarReadings(groupIDs, graphicUnitId, fromTimestamp, toTimestamp, barWidthDays, conn) {
		const allBarReadings = await conn.func('group_bar_readings_unit', [groupIDs, graphicUnitId, barWidthDays, fromTimestamp, toTimestamp]);
		const barReadingsByGroupID = mapToObject(groupIDs, () => []);
		for (const row of allBarReadings) {
			barReadingsByGroupID[row.group_id].push(
				{ reading: row.reading, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return barReadingsByGroupID;
	}

	/**
	 * Gets compare chart readings for the given time range and shift for the given meters
	 * @param meterIDs The meters to get compare chart readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param {Moment} currStartTimestamp start of current/this compare period
	 * @param {Moment} currEndTimestamp end of current/this compare period
	 * @param {Duration} compareShift how far to shift back in time from current period to previous period
	 * @param conn the connection to use.
	 * @returns {Promise<void>}
	 */
	static async getMeterCompareReadings(meterIDs, graphicUnitId, currStartTimestamp, currEndTimestamp, compareShift, conn) {
		const allCompareReadings = await conn.func(
			'meter_compare_readings_unit',
			[meterIDs, graphicUnitId, currStartTimestamp, currEndTimestamp, compareShift.toISOString()]);
		const compareReadingsByMeterID = {};
		for (const row of allCompareReadings) {
			compareReadingsByMeterID[row.meter_id] = {
				curr_use: row.curr_use,
				prev_use: row.prev_use
			};
		}
		return compareReadingsByMeterID;
	}

	/**
	 * Gets compare chart readings for the given time range and shift for the given groups
	 * @param groupIDs The groups to get compare chart readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param {Moment} currStartTimestamp start of current/this compare period
	 * @param {Moment} currEndTimestamp end of current/this compare period
	 * @param {Duration} compareShift how far to shift back in time from current period to previous period
	 * @param conn the connection to use.
	 * @returns {Promise<void>}
	 */
	static async getGroupCompareReadings(groupIDs, graphicUnitId, currStartTimestamp, currEndTimestamp, compareShift, conn) {
		const allCompareReadings = await conn.func(
			'group_compare_readings_unit',
			[groupIDs, graphicUnitId, currStartTimestamp, currEndTimestamp, compareShift.toISOString()]);
		const compareReadingsByGroupID = {};
		for (const row of allCompareReadings) {
			compareReadingsByGroupID[row.group_id] = {
				curr_use: row.curr_use,
				prev_use: row.prev_use
			};
		}
		return compareReadingsByGroupID;
	}

	/**
	 * Gets radar line readings for meters for the given time range
	 * @param meterIDs The meter IDs to get readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp An optional start point for the time range of readings returned
	 * @param toTimestamp An optional end point for the time range of readings returned
	 * @param conn the connection to use.
	 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	static async getMeterRadarReadings(meterIDs, graphicUnitId, fromTimestamp = null, toTimestamp = null, conn) {
		const [maxRawPoints, maxHourlyPoints] = determineMaxPoints();
		/**
		 * @type {array<{meter_id: int, reading_rate: Number, max_rate: Number, min_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		 */
		//Using the same data from meter line readings because they are identical to radar readings.
		const allMeterRadarReadings = await conn.func('meter_line_readings_unit',
			[meterIDs, graphicUnitId, fromTimestamp || '-infinity', toTimestamp || 'infinity', 'auto', maxRawPoints, maxHourlyPoints]
		);
		const radarReadingsByMeterID = mapToObject(meterIDs, () => []);
		for (const row of allMeterRadarReadings) {
			radarReadingsByMeterID[row.meter_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return radarReadingsByMeterID;
	}

	/**
	 * Gets radar readings for groups for the given time range
	 * @param groupIDs The group IDs to get readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp An optional start point for the time range of readings returned
	 * @param toTimestamp An optional end point for the time range of readings returned
	 * @param conn the connection to use.
	 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	static async getGroupRadarReadings(groupIDs, graphicUnitId, fromTimestamp, toTimestamp, conn) {
		// maxRawPoints is not used for groups.
		const [maxRawPoints, maxHourlyPoints] = determineMaxPoints();
		/**
		 * @type {array<{group_id: int, reading_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		 */
		//Using the same data from group line readings because they are identical to group radar readings.
		const allGroupRadarReadings = await conn.func('group_line_readings_unit',
			[groupIDs, graphicUnitId, fromTimestamp, toTimestamp, 'auto', maxHourlyPoints]
		);

		const radarReadingsByGroupID = mapToObject(groupIDs, () => []);
		for (const row of allGroupRadarReadings) {
			radarReadingsByGroupID[row.group_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return radarReadingsByGroupID;
	}

	/**
	 * Gets hour or multiple hour readings for meters for the given time range
	 * @param meterIDs The meter IDs to get readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp Start point for the time range of readings returned
	 * @param toTimestamp End point for the time range of readings returned
	 * @param readingInterval number of hours per reading
	 * @param conn the connection to use.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	static async getThreeDReadings(meterIDs, graphicUnitId, fromTimestamp, toTimestamp, readingInterval, conn) {
		/**
		 * @type {array<{meter_id: int, reading_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		*/
		const allMeterThreeDReadings = await conn.func('meter_3d_readings_unit', [meterIDs, graphicUnitId, fromTimestamp, toTimestamp, readingInterval]);
		const meterThreeDData = threeDHoleAlgorithm(allMeterThreeDReadings, fromTimestamp, toTimestamp);
		return meterThreeDData;
	}

	/**
	 * Gets hour or multiple hour readings for groups for the given time range
	 * @param groupID The group ID to get readings for
	 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @param fromTimestamp Start point for the time range of readings returned
	 * @param toTimestamp End point for the time range of readings returned
	 * @param readingInterval rate of hours per reading
	 * @param conn the connection to use.
	 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	static async getGroupThreeDReadings(groupID, graphicUnitId, fromTimestamp, toTimestamp, readingInterval, conn) {
		/**
		 * @type {array<{group_id: int, reading_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		 */
		const allGroupThreeDReadings = await conn.func('group_3d_readings_unit', [groupID, graphicUnitId, fromTimestamp, toTimestamp, readingInterval]);
		const groupThreeDData = threeDHoleAlgorithm(allGroupThreeDReadings, fromTimestamp, toTimestamp);
		return groupThreeDData;
	}

	toString() {
		return `Reading [id: ${this.meterID}, reading: ${this.reading}, startTimestamp: ${this.startTimestamp}, endTimestamp: ${this.endTimestamp}]`;
	}
}

module.exports = Reading;
