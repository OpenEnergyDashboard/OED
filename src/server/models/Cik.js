/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

/**
 * Represents the Cik conversion model.
 * @see src/server/services/graph/createConversionArrays.js for details on Cik array.
 */
class Cik {
	/**
	 * @param {*} meterUnitId The id of the meter unit.
	 * @param {*} nonMeterUnitId The id of the non meter unit.
	 */
	constructor(meterUnitId, nonMeterUnitId, slope, intercept) {
		this.meterUnitId = meterUnitId;
		this.nonMeterUnitId = nonMeterUnitId;
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
		return new Cik(row.meter_unit_id, row.non_meter_unit_id);
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
}

module.exports = Cik;
