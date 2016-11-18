'use strict';
const db = require('./database');

class Reading {
	/**
	 * Creates a new reading
	 * @param meterID
	 * @param reading
	 * @param {Date} timestamp
	 */
	constructor(meterID, reading, timestamp) {
		if (!timestamp instanceof Date) throw new Error(`Timestamp must be a date, was ${timestamp}, type ${typeof timestamp}`);
		this.meterID = meterID;
		this.reading = reading;
		this.timestamp = timestamp
	}

	/**
	 * Returns a promise to insert all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert
	 * @returns {Promise.<>}
	 */
	static insertAll(readings) {
		return db.tx(t => {
			return t.batch(
				readings.map(r => {
					t.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp})', r)
				})
			)
		})
	}

	/**
	 * Returns a promise to insert or update all of the given readings into the database (as a transaction)
	 * @param {array<Reading>} readings the readings to insert or update
	 * @returns {Promise.<>}
	 */
	static insertOrUpdateAll(readings) {
		return db.tx(t => t.batch(
			readings.map(r => {
				t.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp}) ON CONFLICT (meter_id, read_timestamp) DO UPDATE SET read_timestamp=${timestamp}', r)
			})
		))
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param meterID The id of the meter to find readings for
	 * @returns {Promise.<array.<Reading>>}
	 */
	static getAllByMeterID(meterID) {
		return db.any('SELECT meter_id, reading, read_timestamp FROM readings WHERE meter_id = ${meterID}', {meterID: meterID})
			.then(rows => rows.map(row => new Reading(row['meter_id'], row['reading'], row['read_timestamp'])))
	}


	/**
	 * Returns a promise to insert this reading into the database.
	 * @returns {Promise.<>}
	 */
	insert() {
		return db.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp})', this)
	}

	/**
	 * Returns a promise to insert this reading into the database, or update it if it already exists.
	 * @returns {Promise.<>}
	 */
	insertOrUpdate() {
		return db.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp}) ON CONFLICT (meter_id, read_timestamp) DO UPDATE SET timestamp=${timestamp}', this);
	}

	toString() {
		return `Reading [id: ${this.id}, reading: ${this.reading}, timestamp: ${this.timestamp}]`;
	}
}

module.exports = Reading;