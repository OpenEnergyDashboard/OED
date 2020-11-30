/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const sqlFile = database.sqlFile;

class Timezone {
	/**
	 * Creates a new reading
	 * @param name The name of the timezone
	 * @param abbrev The abbrevation of the timezone
	 * @param offset The offset of the timezone
	 */
	constructor(name, abbrev, offset) {
		this.name = name;
		this.abbrev = abbrev;
		this.offset = offset;
	}
	static mapRow(row) {
		return new Timezone(row.name, row.abbrev, row.utc_offset);
	}
	/**
	 * Returns a promise to get all of the timezones from the database.
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<Timezone>>}
	 */
	static async getAllTimezones(conn) {
		const rows = await conn.any(sqlFile('preferences/get_all_timezones.sql'));
		return rows.map(Timezone.mapRow);
	}
}

module.exports = Timezone;
