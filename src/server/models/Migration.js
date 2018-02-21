/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const db = database.db;
const sqlFile = database.sqlFile;

class Migration {

	constructor(id, from, to, updateTime) {
		this.id = id;
		this.from = from;
		this.to = to;
		this.updateTime = updateTime;
	}

	static createTables() {
		return db.none(sqlFile('group/create_migration_tables.sql'));
	}

	async insert(conn = db) {
		const migration = this;
		if (migration.id !== undefined) {
			throw new Error('Attempt to insert a migration that already has an ID');
		}
		const resp = await conn.one(sqlFile('group/insert_new_migration.sql'), migration);
		this.id = resp.id;
	}
}
module.exports = Migration;
