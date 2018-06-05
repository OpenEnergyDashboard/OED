/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const db = database.db;
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
	 * @return {Promise.<>}
	 */
	static async createTable() {
		await db.none(sqlFile('logemail/create_log_table.sql'));
	}


	/**
	 * Returns a promise to insert this log email into the database
	 * @returns {Promise.<>}
	 */
	async insert() {
		const logEmail = this;
		if (logEmail.id !== undefined) {
			throw new Error('Attempt to insert a log email that already has an ID');
		}
		const resp = await db.one(sqlFile('logemail/insert_new_log.sql'), logEmail);
		this.id = resp.id;
	}

	/**
	 * Returns a promise to delete all logs email
	 * @return {Promise.<void>}
	 */
	static async delete() {
		await db.none(sqlFile('logemail/delete_all_logs.sql'));
	}


	/**
	 * Returns a promise to get all of the log email from the database
	 * @returns {Promise.<array.<LogEmail>>}
	 */
	static async getAll() {
		const rows = await db.any(sqlFile('logemail/get_all_logs.sql'));
		if (rows.length > 0) {
			return rows.map(row => new LogEmail(row.id, row.error_message));
		}
	}
}
module.exports = LogEmail;
