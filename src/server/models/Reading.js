/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const database = require('./database');

const db = database.db;
const sqlFile = database.sqlFile;

class Reading {
	/**
	 * Creates a new reading
	 * @param meterID
	 * @param reading
	 * @param {Date} startTimestamp
	 * @param {Date} endTimestamp
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
		return db.none(sqlFile('reading/create_readings_table.sql'));
	}

	/**
	 * Returns a promise to create the compressed readings function.
	 * @return {Promise.<>}
	 */
	static createCompressedReadingsFunction() {
		return db.none(sqlFile('reading/create_function_get_compressed_readings.sql'));
	}

	/**
	 * Returns a promise to create the aggregate readings function.
	 * @return {Promise.<>}
	 */
	static createAggregateReadingsFunction() {
		return db.none(sqlFile('reading/create_function_get_aggregate_readings.sql'));
	}

	static mapRow(row) {
		return new Reading(row.meter_id, row.reading, row.start_timestamp, row.end_timestamp);
	}

	/**
	 * Returns a promise to insert all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	static insertAll(readings, conn = db) {
		return conn.tx(t => t.batch(
			readings.map(r => t.none(sqlFile('reading/insert_new_reading.sql'), r))
		));
	}

	/**
	 * Returns a promise to insert or update all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	static insertOrUpdateAll(readings, conn = db) {
		return conn.tx(t => t.batch(
			readings.map(r => t.none(sqlFile('reading/insert_or_update_reading.sql'), r))
		));
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param meterID The id of the meter to find readings for
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Reading>>}
	 */
	static async getAllByMeterID(meterID, conn = db) {
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
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Reading>>}
	 */
	static async getReadingsByMeterIDAndDateRange(meterID, startDate, endDate, conn = db) {
		const rows = await conn.any(sqlFile('reading/get_readings_by_meter_id_and_date_range.sql'), {
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
	async insert(conn = db) {
		await conn.none(sqlFile('reading/insert_new_reading.sql'), this);
	}

	/**
	 * Returns a promise to insert this reading into the database, or update it if it already exists.
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	async insertOrUpdate(conn = db) {
		await conn.none(sqlFile('reading/insert_or_update_reading.sql'), this);
	}

	/**
	 * Gets a number of compressed readings that approximate the given time range for the given meters.
	 *
	 * Compressed readings are in kilowatts.
	 * @param meterIDs an array of ids for meters whose points are being compressed
	 * @param fromTimestamp An optional start point for the time range.
	 * @param toTimestamp An optional end point for the time range.
	 * @param numPoints The number of points to compress to. Defaults to 500
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getCompressedReadings(meterIDs, fromTimestamp = null, toTimestamp = null, numPoints = 500, conn = db) {
		fromTimestamp = fromTimestamp && moment(fromTimestamp).toDate();
		toTimestamp = toTimestamp && moment(toTimestamp).toDate();
		const allCompressedReadings = await conn.func('compressed_readings', [meterIDs, fromTimestamp || '-infinity', toTimestamp || 'infinity', numPoints]);

		// Separate the result rows by meter_id and return a nested object.
		const compressedReadingsByMeterID = {};
		for (const row of allCompressedReadings) {
			if (compressedReadingsByMeterID[row.meter_id] === undefined) {
				compressedReadingsByMeterID[row.meter_id] = [];
			}
			compressedReadingsByMeterID[row.meter_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return compressedReadingsByMeterID;
	}

	/**
	 * Gets a number of aggregate readings across the given time interval for the given meters.
	 *
	 * Compressed readings are in kilowatts.
	 * @param meterIDs an array of ids for meters whose points are being compressed
	 * @param duration A moment time interval over which to sum the readings
	 * @param fromTimestamp An optional start point for the beginning of the entire time range.
	 * @param toTimestamp An optional end point for the end of the entire time range.
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: Date, end_timestamp: Date}>>>}
	 */
	static async getAggregateReadings(meterIDs, duration, fromTimestamp = null, toTimestamp = null, conn = db) {
		fromTimestamp = fromTimestamp && moment(fromTimestamp).toDate();
		toTimestamp = toTimestamp && moment(toTimestamp).toDate();
		const allCompressedReadings = await conn.func('aggregate_readings', [meterIDs, duration, fromTimestamp || '-infinity', toTimestamp || 'infinity']);

		// Separate the result rows by meter_id and return a nested object.
		const compressedReadingsByMeterID = {};
		for (const row of allCompressedReadings) {
			if (compressedReadingsByMeterID[row.meter_id] === undefined) {
				compressedReadingsByMeterID[row.meter_id] = [];
			}
			compressedReadingsByMeterID[row.meter_id].push(
				{ reading_rate: row.reading_rate, start_timestamp: row.start_timestamp, end_timestamp: row.end_timestamp }
			);
		}
		return compressedReadingsByMeterID;
	}


	toString() {
		return `Reading [id: ${this.id}, reading: ${this.reading}, timestamp: ${this.timestamp}]`;
	}
}

module.exports = Reading;
