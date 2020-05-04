/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../database');

const sqlFile = database.sqlFile;

class Configfile {
	/**
	 *
	 * @param {number} id This Configfile's ID. Undefined if this file is being created.
	 * @param {string} serialId The serial number of the Obvius device reporting this file
	 * @param {string} modbusId The modbus ID of the device being reported
	 * @param {Moment} created The time at which this Configfile was created.
	 * @param {string} hash The MD5 sum of the contents of this file.
	 * @param {string} contents The contents of this file, as received from AquiSuite.
	 * @param {boolean} processed Whether or not this Configfile has been processed.
	 */
	constructor(id, serialId, modbusId, created, hash, contents, processed) {
		this.id = id;
		this.serialId = serialId;
		this.modbusId = modbusId;
		this.created = created;
		this.hash = hash;
		this.contents = contents;
		this.processed = processed;
	}

	/**
	 * Returns a promise to create the Configfile table.
	 * @param conn The connection to use.
	 * @return {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('obvius/create_config_table.sql'));
	}

	/**
	 * Returns a promise to remove all entries in the table.
	 * @param conn The connection to use.
	 * @return {Promise.<>}
	 */
	static purgeAll(conn) {
		return conn.none(sqlFile('obvius/purge_configs.sql'));
	}

	static mapRow(row) {
		return new Configfile(row.id, row.serial_id, row.modbus_id, row.created, row.hash, row.contents, row.processed);
	}

	/**
	 * Returns a promise to get a specific Configfile by ID
	 * @param {number} id
	 * @param conn The connection to use.
	 */
	static async getByID(id, conn) {
		const row = await conn.one(sqlFile('obvius/get_configs_by_id.sql'), {id: id});
		return Configfile.mapRow(row);
	}

	/**
	 * Returns a promise to get all the Configfile associated with the serial number,
	 * ordered by the date of creation, ascending.
	 * @param {string} id the serial number to look up
	 * @param conn The connection to use..
	 */
	static async getBySerial(id, conn) {
		const rows = await conn.any(sqlFile('obvius/get_configs_by_sn.sql'), {serialId: id});
		return rows.map(Configfile.mapRow);
	}

	/**
	 * Returns a promise to get all the Configfiles stored.
	 * @param conn The connection to use.
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('obvius/get_all_configs.sql'));
		return rows.map(Configfile.mapRow);
	}

	/**
	 * Returns ??
	 * @param conn The connection to use.
	 */
	async insert(conn) {
		const configfile = this;
		if (this.id !== undefined) {
			throw new Error('Attempt to insert a Configfile with an existing ID.');
		}
		const resp = await conn.one(sqlFile('obvius/insert_new_config.sql'), configfile);
		this.id = resp.id;
	}

	/**
	 * Computes and returns a sensible filename for this Configfile
	 * @returns {string}
	 */
	makeFilename() {
		return `${this.serialId}-mb-${this.modbusId}.ini`;
	}
}

module.exports = Configfile;
