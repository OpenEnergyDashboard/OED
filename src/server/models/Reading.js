/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const { mapToObject } = require('../util');

const sqlFile = database.sqlFile;

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
	 * @return {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('reading/create_readings_table.sql'));
	}

	/**
	 * Returns a promise to create the compressed readings function.
	 * @param conn the database connection to use
	 * @return {Promise.<>}
	 */
	static createCompressedReadingsFunction(conn) {
		return conn.none(sqlFile('reading/create_function_get_compressed_readings.sql'));
	}

	/**
	 * Returns a promise to create the compressed groups readings function.
	 * @param conn the database connection to use
	 * @return {Promise.<>}
	 */
	static createCompressedGroupsReadingsFunction(conn) {
		return conn.none(sqlFile('reading/create_function_get_compressed_groups_readings.sql'));
	}

	/**
	 * Returns a promise to create the compressed groups barchart readings function.
	 * @param conn the database connection to use
	 * @return {Promise.<>}
	 */
	static createCompressedGroupsBarchartReadingsFunction(conn) {
		return conn.none(sqlFile('reading/create_function_get_group_barchart_readings.sql'));
	}

	/**
	 * Returns a promise to create the barchart readings function.
	 * @return {Promise.<>}
	 */
	static createBarchartReadingsFunction(conn) {
		return conn.none(sqlFile('reading/create_function_get_barchart_readings.sql'));
	}

	/**
	 * Returns a promise to create the function and materialized views that aggregate
	 * readings by various time intervals.
	 * @param conn the database connection to use
	 * @return {Promise<void>}
	 */
	static createCompressedReadingsMaterializedViews(conn) {
		return conn.none(sqlFile('reading/create_compressed_reading_views.sql'));
	}

	/**
	 * Returns a promise to create the compare function
	 * @param conn the database connection to use
	 */
	static createCompareReadingsFunction(conn) {
		return conn.none(sqlFile('reading/create_function_get_compare_readings.sql'));
	}

	/**
	 * Refreshes the daily readings view.
	 * Should be called at least once a day, preferably in the middle of the night.
	 * @param conn The connection to use
	 * @return {Promise<void>}
	 */
	static refreshCompressedReadings(conn) {
		// This can't be a function because you can't call REFRESH inside a function
		return conn.none('REFRESH MATERIALIZED VIEW daily_readings');
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
		return conn.tx(t => t.sequence(function seq(i) {
			const seqT = this;
			return readings[i] && readings[i].insert(seqT);
		}));
	}

	/**
	 * Returns a promise to insert or update all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static insertOrUpdateAll(readings, conn) {
		return conn.tx(t => t.sequence(function seq(i) {
			const seqT = this;
			return readings[i] && readings[i].insertOrUpdate(seqT);
		}));
	}

	/**
	 * Returns a promise to insert or ignore all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @param conn is the connection to use.
	 * @returns {Promise<any>}
	 */
	static insertOrIgnoreAll(readings, conn) {
		return conn.tx(t => t.sequence(function seq(i) {
			const seqT = this;
			return readings[i] && readings[i].insertOrIgnore(seqT);
		}));
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
	 * Returns a promise to get all of the readings for this meter within (inclusive) a specified date range from the
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
		return rows.map(Reading.mapRow);
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
	 * Gets a number of compressed readings that approximate the given time range for the given meters.
	 *
	 * Compressed readings are in kilowatts.
	 * @param meterIDs an array of ids for meters whose points are being compressed
	 * @param {Moment?} fromTimestamp An optional start point for the time range.
	 * @param {Moment?} toTimestamp An optional end point for the time range
	 * @param numPoints The number of points to compress to. Defaults to 500
	 * @param conn is the connection to use.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getCompressedReadings(meterIDs, fromTimestamp = null, toTimestamp = null, numPoints = 500, conn) {
		const allCompressedReadings = await conn.func('compressed_readings',
			[meterIDs, fromTimestamp || '-infinity', toTimestamp || 'infinity', numPoints]);
		// Separate the result rows by meter_id and return a nested object.
		const compressedReadingsByMeterID = mapToObject(meterIDs, () => []); // Returns { 1: [], 2: [], ... }
		// For each row in the allCompressedReadings table, append the compressed reading value to the array for
		// the meter that corresponds to that reading.
		for (const row of allCompressedReadings) {
			compressedReadingsByMeterID[row.meter_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return compressedReadingsByMeterID;
	}

	/**
	 * Gets a number of compressed readings that approximate the given time range for the given groups.
	 *
	 * Compressed readings are in kilowatts.
	 * @param groupIDs an array of ids for groups whose points are being compressed
	 * @param {Moment?} fromTimestamp An optional start point for the time range.
	 * @param {Moment?} toTimestamp An optional end point for the time range
	 * @param numPoints The number of points to compress to. Defaults to 500
	 * @param conn is the connection to use.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: Moment, end_timestamp: Moment}>>>}
	 */
	static async getCompressedGroupReadings(groupIDs, fromTimestamp = null, toTimestamp = null, numPoints = 500, conn) {
		const allCompressedReadings = await conn.func('compressed_group_readings',
			[groupIDs, fromTimestamp || '-infinity', toTimestamp || 'infinity', numPoints]);
		// Separate the result rows by meter_id and return a nested object.
		const compressedReadingsByGroupID = mapToObject(groupIDs, () => []); // Returns { 1: [], 2: [], ... }
		for (const row of allCompressedReadings) {
			compressedReadingsByGroupID[row.group_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return compressedReadingsByGroupID;
	}

	/**
	 * Gets barchart readings for every meter across the given time interval for a duration.
	 *
	 * Compressed readings are in kilowatts.
	 * @param meterIDs an array of ids for meters whose points are being compressed
	 * @param duration A moment time duration over which to sum the readings
	 * @param fromTimestamp An optional start point for the beginning of the entire time range.
	 * @param toTimestamp An optional end point for the end of the entire time range.
	 * @param conn is the connection to use.
	 * @return {Promise<object<int, array<{reading_sum: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getBarchartReadings(meterIDs, duration, fromTimestamp = null, toTimestamp = null, conn) {
		const allBarchartReadings = await conn.func('barchart_readings', [meterIDs, duration, fromTimestamp || '-infinity', toTimestamp || 'infinity']);
		// Separate the result rows by meter_id and return a nested object.
		const barchartReadingsByMeterID = mapToObject(meterIDs, () => []);
		for (const row of allBarchartReadings) {
			barchartReadingsByMeterID[row.meter_id].push(
				{ reading_sum: row.reading_sum, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return barchartReadingsByMeterID;
	}

	/**
	 * Gets barchart readings for every group across the given time interval for a duration.
	 *
	 * Compressed readings are in kilowatts.
	 * @param groupIDs an array of ids for groups whose points are being compressed
	 * @param duration A moment time duration over which to sum the readings
	 * @param fromTimestamp An optional start point for the beginning of the entire time range.
	 * @param toTimestamp An optional end point for the end of the entire time range.
	 * @param conn is the connection to use.
	 * @return {Promise<object<int, array<{reading_sum: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getGroupBarchartReadings(groupIDs, duration, fromTimestamp = null, toTimestamp = null, conn) {
		const allBarchartReadings = await conn.func('barchart_group_readings',
			[groupIDs, duration, fromTimestamp || '-infinity', toTimestamp || 'infinity']);
		// Separate the result rows by meter_id and return a nested object.
		const barchartReadingsByGroupID = mapToObject(groupIDs, () => []);
		for (const row of allBarchartReadings) {
			// If there was an unexpected group id in the barchart readings by group, just create a place to hold
			// that value in the object to be returned.
			if (barchartReadingsByGroupID[row.group_id] === undefined) {
				barchartReadingsByGroupID[row.group_id] = [];
			}
			barchartReadingsByGroupID[row.group_id].push(
				{ reading_sum: row.reading_sum, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return barchartReadingsByGroupID;
	}

	/**
	 * Gets compressed readings for the given time range
	 * @param meterIDs
	 * @param fromTimestamp
	 * @param toTimestamp
	 * @param conn the connection to use.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	static async getNewCompressedReadings(meterIDs, fromTimestamp = null, toTimestamp = null, conn) {
		/**
		 * @type {array<{meter_id: int, reading_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		 */
		const allCompressedReadings = await conn.func('compressed_readings_2', [meterIDs, fromTimestamp || '-infinity', toTimestamp || 'infinity']);

		const compressedReadingsByMeterID = mapToObject(meterIDs, () => []);
		for (const row of allCompressedReadings) {
			compressedReadingsByMeterID[row.meter_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return compressedReadingsByMeterID;
	}


	/**
	 * Gets compressed readings for the given time range
	 * @param groupIDs
	 * @param fromTimestamp
	 * @param toTimestamp
	 * @param conn the connection to use.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: Moment, end_timestamp: Moment}>>>}
	 */
	static async getNewCompressedGroupReadings(groupIDs, fromTimestamp, toTimestamp, conn) {
		/**
		 * @type {array<{group_id: int, reading_rate: Number, start_timestamp: Moment, end_timestamp: Moment}>}
		 */
		const allCompressedGroupReadings = await conn.func('compressed_group_readings_2', [groupIDs, fromTimestamp, toTimestamp]);

		const compressedReadingsByGroupID = mapToObject(groupIDs, () => []);
		for (const row of allCompressedGroupReadings) {
			compressedReadingsByGroupID[row.group_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return compressedReadingsByGroupID;
	}

	/**
	 * Gets barchart readings for the given time range for the given meters
	 * @param meterIDs The meters to get barchart readings for
	 * @param fromTimestamp The start of the barchart interval
	 * @param toTimestamp the end of the barchart interval
	 * @param barWidthDays the width of each bar in days
	 * @param conn the connection to use.
	 * @return {Promise<object<int, array<{reading: number, start_timestamp: Moment, end_timestamp: Moment}>>>}
	 */
	static async getNewCompressedBarchartReadings(meterIDs, fromTimestamp, toTimestamp, barWidthDays, conn) {
		const allBarReadings = await conn.func('compressed_barchart_readings_2', [meterIDs, barWidthDays, fromTimestamp, toTimestamp]);
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
	 * @param fromTimestamp The start of the barchart interval
	 * @param toTimestamp the end of the barchart interval
	 * @param barWidthDays the width of each bar in days
	 * @param conn the connection to use.
	 * @return {Promise<object<int, array<{reading: number, start_timestamp: Moment, end_timestamp: Moment}>>>}
	 */
	static async getNewCompressedBarchartGroupReadings(groupIDs, fromTimestamp, toTimestamp, barWidthDays, conn) {
		const allBarReadings = await conn.func('compressed_barchart_group_readings_2', [groupIDs, barWidthDays, fromTimestamp, toTimestamp]);
		const barReadingsByGroupID = mapToObject(groupIDs, () => []);
		for (const row of allBarReadings) {
			barReadingsByGroupID[row.group_id].push(
				{ reading: row.reading, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return barReadingsByGroupID;
	}

	/**
	 *
	 * @param meterIDs
	 * @param {Moment} currStartTimestamp
	 * @param {Moment} currEndTimestamp
	 * @param {Duration} compareShift
	 * @param conn the connection to use.
	 * @return {Promise<void>}
	 */
	static async getCompareReadings(meterIDs, currStartTimestamp, currEndTimestamp, compareShift, conn) {
		const allCompareReadings = await conn.func(
			'compare_readings',
			[meterIDs, currStartTimestamp, currEndTimestamp, compareShift.toISOString()]);
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
	 *
	 * @param groupIDs
	 * @param {Moment} currStartTimestamp
	 * @param {Moment} currEndTimestamp
	 * @param {Duration} compareShift
	 * @param conn the connection to use
	 * @return {Promise<void>}
	 */
	static async getGroupCompareReadings(groupIDs, currStartTimestamp, currEndTimestamp, compareShift, conn) {
		const allCompareReadings = await conn.func(
			'group_compare_readings',
			[groupIDs, currStartTimestamp, currEndTimestamp, compareShift.toISOString()]);
		const compareReadingsByGroupID = {};
		for (const row of allCompareReadings) {
			compareReadingsByGroupID[row.group_id] = {
				curr_use: row.curr_use,
				prev_use: row.prev_use
			};
		}
		return compareReadingsByGroupID;
	}

	toString() {
		return `Reading [id: ${this.meterID}, reading: ${this.reading}, startTimestamp: ${this.startTimestamp}, endTimestamp: ${this.endTimestamp}]`;
	}
}

module.exports = Reading;
