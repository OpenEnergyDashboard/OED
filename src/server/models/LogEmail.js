/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const sqlFile = database.sqlFile;

class LogEmail {
	/**
	 * @param id should be undefined when creating a new log email
	 * @param errorMessage
	 */
	constructor(id, errorMessage) {
		this.id = id;
		this.errorMessage = errorMessage;
	}

	/**
	 * Returns a promise to create the log email table.
	 * @param conn the connection to be used.
	 * @return {Promise.<>}
	 */
	static async createTable(conn) {
		await conn.none(sqlFile('logemail/create_log_table.sql'));
	}


	/**
	 * Returns a promise to insert this log email into the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const logEmail = this;
		if (logEmail.id !== undefined) {
			throw new Error('Attempt to insert a log email that already has an ID');
		}
		const resp = await conn.one(sqlFile('logemail/insert_new_log.sql'), logEmail);
		this.id = resp.id;
	}

	/**
	 * Returns a promise to delete all logs email
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	static async delete(conn) {
		await conn.none(sqlFile('logemail/delete_all_logs.sql'));
	}


	/**
	 * Returns a promise to get all of the log email from the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<array.<LogEmail>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('logemail/get_all_logs.sql'));
		if (rows.length > 0) {
			return rows.map(row => new LogEmail(row.id, row.error_message));
		}
	}
}
module.exports = LogEmail;
