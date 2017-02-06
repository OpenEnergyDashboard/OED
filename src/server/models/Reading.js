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
		if (!(startTimestamp instanceof Date)) {
			throw new Error(`startTimestamp must be a date, was ${startTimestamp}, type ${typeof startTimestamp}`);
		}
		if (!(endTimestamp instanceof Date)) {
			throw new Error(`endTimestamp must be a date, was ${endTimestamp}, type ${typeof endTimestamp}`);
		}
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

	static mapRow(row) {
		return new Reading(row.meter_id, row.reading, row.start_timestamp, row.end_timestamp);
	}

	/**
	 * Returns a promise to insert all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert
	 * @returns {Promise.<>}
	 */
	static insertAll(readings) {
		return db.tx(t => t.batch(
			readings.map(r => t.none(sqlFile('reading/insert_new_reading.sql'), r))
		));
	}

	/**
	 * Returns a promise to insert or update all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @returns {Promise.<>}
	 */
	static insertOrUpdateAll(readings) {
		return db.tx(t => t.batch(
			readings.map(r => t.none(sqlFile('reading/insert_or_update_reading.sql'), r))
		));
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param meterID The id of the meter to find readings for
	 * @returns {Promise.<array.<Reading>>}
	 */
	static getAllByMeterID(meterID) {
		return db.any(sqlFile('reading/get_all_readings_by_meter_id.sql'), { meterID: meterID })
			.then(rows => rows.map(Reading.mapRow));
	}

	/**
	 * Returns a promise to get all of the readings for this meter within (inclusive) a specified date range from the
	 * database. If no startDate is specified, all readings from the beginning of time to the endDate are returned.
	 * If no endDate is specified, all readings after and including the startDate are returned.
	 * @param meterID
	 * @param {Date} startDate
	 * @param {Date} endDate
	 * @returns {Promise.<array.<Reading>>}
	 */
	static getReadingsByMeterIDAndDateRange(meterID, startDate, endDate) {
		return db.any(sqlFile('reading/get_readings_by_meter_id_and_date_range.sql'), { meterID: meterID, startDate: startDate, endDate: endDate })
			.then(rows => rows.map(Reading.mapRow));
	}

	/**
	 * Returns a promise to insert this reading into the database.
	 * @returns {Promise.<>}
	 */
	insert() {
		return db.none(sqlFile('reading/insert_new_reading.sql'), this);
	}

	/**
	 * Returns a promise to insert this reading into the database, or update it if it already exists.
	 * @returns {Promise.<>}
	 */
	insertOrUpdate() {
		return db.none(sqlFile('reading/insert_or_update_reading.sql'), this);
	}

	static getCompressedReadings(meterID, fromTimestamp = null, toTimestamp = null, numPoints = 500) {
		return db.func('compressed_readings', [meterID, fromTimestamp || '-infinity', toTimestamp || 'infinity', numPoints]);
	}

	toString() {
		return `Reading [id: ${this.id}, reading: ${this.reading}, timestamp: ${this.timestamp}]`;
	}
}

module.exports = Reading;
