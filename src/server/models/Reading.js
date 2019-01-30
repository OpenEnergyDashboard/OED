/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const database = require('./database');
const { mapToObject } = require('../util');

const getDB = database.getDB;
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
	 * @return {Promise.<>}
	 */
	static createTable() {
		return getDB().none(sqlFile('reading/create_readings_table.sql'));
	}

	/**
	 * Returns a promise to create the compressed readings function.
	 * @return {Promise.<>}
	 */
	static createCompressedReadingsFunction() {
		return getDB().none(sqlFile('reading/create_function_get_compressed_readings.sql'));
	}

	/**
	 * Returns a promise to create the compressed groups readings function.
	 * @returns {Promise.<>}
	 */
	static createCompressedGroupsReadingsFunction() {
		return getDB().none(sqlFile('reading/create_function_get_compressed_groups_readings.sql'));
	}

	/**
	 * Returns a promise to create the group barchart readings function.
	 * @returns {Promise.<>}
	 */
	static createCompressedGroupsBarchartReadingsFunction() {
		return getDB().none(sqlFile('reading/create_function_get_group_barchart_readings.sql'));
	}

	/**
	 * Returns a promise to create the barchart readings function.
	 * @return {Promise.<>}
	 */
	static createBarchartReadingsFunction() {
		return getDB().none(sqlFile('reading/create_function_get_barchart_readings.sql'));
	}

	/**
	 * Change a row from the readings table into a Reading object.
	 * @param row The row from the table to be changed.
	 * @returns {Reading}
	 */
	static mapRow(row) {
		return new Reading(row.meter_id, row.reading, row.start_timestamp, row.end_timestamp);
	}

	/**
	 * Returns a promise to insert all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	static insertAll(readings, conn = getDB) {
		// TODO: What does tx and sequence do?
		return conn().tx(t => t.sequence(function seq(i) {
			const seqT = this;
			return readings[i] && readings[i].insert(conn = () => seqT);
		}));
	}

	/**
	 * Returns a promise to insert or update all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	static insertOrUpdateAll(readings, conn = getDB) {
		return conn().tx(t => t.sequence(function seq(i) {
			const seqT = this;
			return readings[i] && readings[i].insertOrUpdate(conn = () => seqT);
		}));
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param meterID The id of the meter to find readings for
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Reading>>}
	 */
	static async getAllByMeterID(meterID, conn = getDB) {
		const rows = await conn().any(sqlFile('reading/get_all_readings_by_meter_id.sql'), { meterID: meterID });
		return rows.map(Reading.mapRow);
	}

	/**
	 * Returns a promise to get all of the readings for this meter within (inclusive) a specified date range from the
	 * database. If no startDate is specified, all readings from the beginning of time to the endDate are returned.
	 * If no endDate is specified, all readings after and including the startDate are returned.
	 * @param meterID
	 * @param {Date} startDate
	 * @param {Date} endDate
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Reading>>}
	 */
	static async getReadingsByMeterIDAndDateRange(meterID, startDate, endDate, conn = getDB) {
		const rows = await conn().any(sqlFile('reading/get_readings_by_meter_id_and_date_range.sql'), {
			meterID: meterID,
			startDate: startDate,
			endDate: endDate
		});
		return rows.map(Reading.mapRow);
	}

	/**
	 * Returns a promise to insert this reading into the database.
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	insert(conn = getDB) {
		return conn().none(sqlFile('reading/insert_new_reading.sql'), this);
	}

	/**
	 * Returns a promise to insert this reading into the database, or update it if it already exists.
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	insertOrUpdate(conn = getDB) {
		return conn().none(sqlFile('reading/insert_or_update_reading.sql'), this);
	}

	/**
	 * Gets a number of compressed readings that approximate the given time range for the given meters.
	 *
	 * Compressed readings are in kilowatts.
	 * @param meterIDs an array of ids for meters whose points are being compressed
	 * @param {Moment?} fromTimestamp An optional start point for the time range.
	 * @param {Moment?} toTimestamp An optional end point for the time range
	 * @param numPoints The number of points to compress to. Defaults to 500
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getCompressedReadings(meterIDs, fromTimestamp = null, toTimestamp = null, numPoints = 500, conn = getDB) {
		const allCompressedReadings = await conn().func('compressed_readings',
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
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: Moment, end_timestamp: Moment}>>>}
	 */
	static async getCompressedGroupReadings(groupIDs, fromTimestamp = null, toTimestamp = null, numPoints = 500, conn = getDB) {
		const allCompressedReadings = await conn().func('compressed_group_readings',
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
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @return {Promise<object<int, array<{reading_sum: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getBarchartReadings(meterIDs, duration, fromTimestamp = null, toTimestamp = null, conn = getDB) {
		const allBarchartReadings = await conn().func('barchart_readings', [meterIDs, duration, fromTimestamp || '-infinity', toTimestamp || 'infinity']);
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
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @return {Promise<object<int, array<{reading_sum: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getGroupBarchartReadings(groupIDs, duration, fromTimestamp = null, toTimestamp = null, conn = getDB) {
		const allBarchartReadings = await conn().func('barchart_group_readings',
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


	toString() {
		return `Reading [id: ${this.meterID}, reading: ${this.reading}, startTimestamp: ${this.startTimestamp}, endTimestamp: ${this.endTimestamp}]`;
	}
}

module.exports = Reading;
