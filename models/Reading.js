'use strict';
const db = require('./database');

class Reading {
	constructor(meterID, reading, timestamp) {
		if (!timestamp instanceof Date) throw new Error(`Timestamp must be a date, was ${timestamp}, type ${typeof timestamp}`);
		this.meterID = meterID;
		this.reading = reading;
		this.timestamp = timestamp
	}

	static insertAll(readings) {
		return db.tx(t => {
			return t.batch(
				readings.map(r => {
					t.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp})', r)
				})
			)
		})
	}

	static insertOrUpdateAll(readings) {
		return db.tx(t => t.batch(
			readings.map(r => {
				t.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp}) ON CONFLICT (meter_id, read_timestamp) DO UPDATE SET read_timestamp=${timestamp}', r)
			})
		))
	}

	static getAllByMeterID(meterID) {
		return db.any('SELECT meter_id, reading, read_timestamp FROM readings WHERE meter_id = ${meterID}', {meterID: meterID})
			.then(rows => rows.map(row => new Reading(row['meter_id'], row['reading'], row['read_timestamp'])))
	}


	insert() {
		return db.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp})', this)
	}

	insertOrUpdate() {
		return db.none('INSERT INTO readings (meter_id, reading, read_timestamp) VALUES (${meterID}, ${reading}, ${timestamp}) ON CONFLICT (meter_id, read_timestamp) DO UPDATE SET timestamp=${timestamp}', this);
	}

	toString() {
		return `Reading [id: ${this.id}, reading: ${this.reading}, timestamp: ${this.timestamp}]`;
	}
}

module.exports = Reading;