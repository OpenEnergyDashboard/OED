/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const database = require('./database');
const { TimeInterval } = require('../../common/TimeInterval');
const sqlFile = database.sqlFile;
class Baseline {
	constructor(meterID, applyStart, applyEnd, calcStart, calcEnd, note = null, baselineValue = null) {
		this.meterID = meterID;
		this.applyRange = new TimeInterval(applyStart, applyEnd);
		this.calcRange = new TimeInterval(calcStart, calcEnd);
		this.baselineValue = baselineValue;
		this.note = note;
	}

	/**
	 * Returns a promise to create the baseline table
	 * @returns Promise for baseline table creation
	 */
	static createTable(conn) {
		return conn.none(sqlFile('baseline/create_baseline_table.sql'));
	}

	/**
	 * Creates a new baseline from the data in a row.
	 * @param row the row from which the baseline is to be created
	 * @returns Baseline object from row
	 */
	static mapRow(row) {
		return new Baseline(row.meter_id, row.apply_start, row.apply_end, row.calc_start, row.calc_end,
			row.note, row.baseline_value);
	}

	/**
	 * Returns a promise to insert this baseline into the database.
	 * @param conn the database connection to use
	 * @returns Promise for database insert
	 */
	async insert(conn) {
		const resp = await conn.one(sqlFile('baseline/new_baseline.sql'), {
			meter_id: this.meterID,
			apply_start: this.applyRange.startTimestamp,
			apply_end: this.applyRange.endTimestamp,
			calc_start: this.calcRange.startTimestamp,
			calc_end: this.calcRange.endTimestamp,
			note: this.note
		});
		this.baselineValue = resp.baseline_value;
	}

	/**
	 * Returns a promise to get all of the baselines from the given meter.
	 * @param meterID the id of the meter from which baselines will be gotten
	 * @param conn the database connection to use
	 * @returns Promise for all baselines for meter
	 */
	static async getAllForMeterID(meterID, conn) {
		const rows = await conn.any(sqlFile('baseline/get_baselines_by_meter_id.sql'), { meter_id: meterID });
		return rows.map(row => Baseline.mapRow(row));
	}

	/**
	 * Returns a promise to get all of the baselines from the database.
	 * @param conn the database connection to use
	 * @returns Promise for all baselines
	 */
	static async getAllBaselines(conn) {
		const rows = await conn.any(sqlFile('baseline/get_all_baselines.sql'));
		return rows.map(row => Baseline.mapRow(row));
	}
}

module.exports = Baseline;
