/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const { findMaxSemanticVersion } = require('../util');
const VERSION = require('../version');

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
	 * @param conn is the connection to use.
	 * @param insertDefault { boolean } whether or not to insert the default migration.
	 *     True by default.
	 * @return {Promise.<>}
	 */
	static async createTable(conn, insertDefault = true) {
		await conn.none(sqlFile('migration/create_migration_table.sql'));
		if (insertDefault) {
			await Migration.insertDefaultMigration(conn);
		}
	}

	static async insertDefaultMigration(conn) {
		const version = `${VERSION.major}.${VERSION.minor}.${VERSION.patch}`;
		await conn.tx(async t => {
			const migration = new Migration(undefined, undefined, version);
			migration.insert(t);
		});
	}

	/**
	 * Returns a promise to insert this migration into the database
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const migration = this;
		if (migration.id !== undefined) {
			throw new Error('Attempt to insert a migration that already has an ID');
		}
		const resp = await conn.one(sqlFile('migration/insert_new_migration.sql'), migration);
		this.id = resp.id;
	}

	/**
	 * Returns a promise to retrieve the current version of the database.
	 * @param conn is the connection to use.
	 * @returns {Promise.<Migration>}
	 */
	static async getCurrentVersion(conn) {
		const migrations = await Migration.getAll(conn);
		return findMaxSemanticVersion(migrations.map(m => m.toVersion));
	}

	/**
	 * Returns a promise to get all of the migration from the database
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<User>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('migration/get_all_migrations.sql'));
		if (rows.length > 0) {
			return rows.map(row => new Migration(row.id, row.from_version, row.to_version, row.update_time));
		} else {
			throw new Error('There is nothing in the migration table.');
		}
	}
}
module.exports = Migration;
