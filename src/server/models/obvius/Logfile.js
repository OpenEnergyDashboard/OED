/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../database');

const db = database.db;
const sqlFile = database.sqlFile;

class Logfile {
	/**
	 * 
	 * @param {number} id This Logfile's ID. Undefined if this file is being created.
	 * @param {string} filename The filename of this logfile.
	 * @param {moment} created The time at which this logfile was created.
	 * @param {string} hash The MD5 sum of the contents of this file.
	 * @param {string} contents The contents of this file, as received from AquiSuite.
	 * @param {boolean} processed Whether or not this logfile has been processed.
	 */
	constructor(id, filename, created, hash, contents, processed) {
		this.id = id;
		this.filename = filename;
		this.created = created;
		this.hash = hash;
		this.contents = contents;
		this.processed = processed;
	}

	/**
	 * Returns a promise to create the logfile table.
	 * @return {Promise.<>}
	 */
	static createTable() {
		return db.none(sqlFile('obvius/create_logs_table.sql'));
	}

	static mapRow(row) {
		return new Logfile(row.id, row.filename, row.created, row.hash, row.contents, row.processed);
	}

	/**
	 * Returns a promise to get a specific logfile by ID
	 * @param {number} id 
	 * @param conn The connection to use. Defaults to the default DB connection.
	 */
	static async getByID(id, conn = db) {
		const row = await conn.one(sqlFile('obvius/get_logs_by_id.sql'), {id: id});
		return Logfile.mapRow(row);
	}

	/**
	 * Returns a promise to get all the logfiles stored.
	 * @param conn The connection to use. Defaults to the default DB connection. 
	 */
	static async getAll(conn = db) {
		const rows = await conn.any(sqlFile("obvius/get_all_logs.sql"));
		return rows.map(Logfile.mapRow);
	}

	async insert(conn = db) {
		const logfile = this;
		if (this.id !== undefined) {
			throw new Error('Attempt to insert a Logfile with an existing ID.');
		}
		const resp = await conn.one(sqlFile('obvius/insert_new_log.sql'), logfile);
		this.id = resp.id;
	}
}

module.exports = Logfile;
