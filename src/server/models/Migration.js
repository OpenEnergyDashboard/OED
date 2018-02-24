/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const { findMaxSemanticVersion } = require('../util');

const db = database.db;
const sqlFile = database.sqlFile;

class Migration {
	/**
	 * @param id should be undefined when creating a new migration
	 * @param fromVersion current version
	 * @param toVersion version want to update to
	 * @param updateTime time when migrate database
	 */
	constructor(id, fromVersion, toVersion, updateTime) {
		this.id = id;
		this.fromVersion = fromVersion;
		this.toVersion = toVersion;
		this.updateTime = updateTime;
	}

	/**
	 * Returns a promise to create the migration table.
	 * @return {Promise.<>}
	 */
	static createTables() {
		return db.none(sqlFile('migration/create_migration_table.sql'));
	}

	/**
	 * Returns a promise to insert this migration into the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	async insert(conn = db) {
		const migration = this;
		if (migration.id !== undefined) {
			throw new Error('Attempt to insert a migration that already has an ID');
		}
		const resp = await conn.one(sqlFile('migration/insert_new_migration.sql'), migration);
		this.id = resp.id;
	}

	/**
	 * Returns a promise to retrieve the current version of the database.
	 * @returns {Promise.<Migration>}
	 */
	static async getCurrentVersion() {
		const row = await db.one(sqlFile('migration/get_current_version.sql'));
		const currentVersion = findMaxSemanticVersion(row);
		return currentVersion;
	}
}
module.exports = Migration;
