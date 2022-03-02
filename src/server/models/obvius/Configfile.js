/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../database');

const sqlFile = database.sqlFile;

const { processConfigFile } = require('./processConfigFile');
const { log } = require('../../log');

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
		const row = await conn.one(sqlFile('obvius/get_configs_by_id.sql'), { id: id });
		return Configfile.mapRow(row);
	}

	/**
	 * Returns a promise to get all the Configfile associated with the serial number,
	 * ordered by the date of creation, ascending.
	 * @param {string} id the serial number to look up
	 * @param conn The connection to use..
	 */
	static async getBySerial(id, conn) {
		const rows = await conn.any(sqlFile('obvius/get_configs_by_sn.sql'), { serialId: id });
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
	 * Returns Promise<>
	 * @param conn The connection to use.
	 */
	async insert(conn) {
		const configFile = this;
		if (this.id !== undefined) {
			throw new Error('Attempt to insert a Configfile with an existing ID.');
		}
		const resp = await conn.one(sqlFile('obvius/insert_new_config.sql'), configFile);
		this.id = resp.id;

		// insert meters from file contents
		const obviusMeters = processConfigFile(configFile);
		await Configfile.insertNewMeters(obviusMeters, conn)
	}

	/**
	 * Computes and returns a sensible filename for this Configfile
	 * @returns {string}
	 */
	makeFilename() {
		return `${this.serialId}-mb-${this.modbusId}.ini`;
	}

	/**
	 * promises to insert the meters into the database
	 * This version is designed to deal with Obvius config files.
	 * @param meters rows of the meters
	 * @param conn the database connection to use
	 * @returns {Promise.<>}
	 */
	static async insertNewMeters(rows, conn) {
		await Promise.all(rows.map(
			async meter => {
				try {
					// If a configuration file was previously sent for this meter, then don't try to insert.
					if (await meter.existsByName(conn)) {
						// TODO We should check when and why Obvius sends us the same meter twice. It might be the case that we need
						// to update the meter in this case.
						log.info(`During Obvius configuration file processing the meter ${meter.name} already exists so not added.`);
					} else {
						log.info(`During Obvius configuration file processing the meter ${meter.name} is being created`);
						await meter.insert(conn);
					}
				} catch (err) {
					log.error(`Error inserting meter ${meter.name} during processing of Obvius configuration file with error: `, err)
				}
			})
		);
	}
}

module.exports = Configfile;
