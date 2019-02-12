/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file exports two useful items: testDB, which provides the method .getConnection,
 * returning a connection to the testing database, and recreateDB, which destroys the
 * database and creates a new schema there.
 */

const mocha = require('mocha');
const { log, LogLevel } = require('../../log');
const { getDB, createSchema, stopDB } = require('../../models/database');

// Global database connection object, whose members are accessible to DB-touching tests.
// For instance, call:
// conn = testDB.getConnection();
// doSomething(conn)
let testDB = {
	_connection: null,
	config: null,
	getConnection: function() {
		return this._connection;
	}
};

function connectTestDB() {
	const testDBConfig = {
		user: process.env.OED_DB_TEST_USER || process.env.OED_DB_USER,
		database: process.env.OED_DB_TEST_DATABASE,
		password: process.env.OED_DB_TEST_PASSWORD || process.env.OED_DB_PASSWORD,
		host: process.env.OED_DB_TEST_HOST || process.env.OED_DB_HOST,
		port: process.env.OED_DB_TEST_PORT || process.env.OED_DB_PORT
	};

	stopDB();
	testDB._connection = getDB(testDBConfig);
	testDB.config = testDBConfig;
}

// Disable logging during tests.
// TODO: Move logging disabling to a better place.
log.level = LogLevel.SILENT;
log.emailLevel = LogLevel.SILENT;

async function recreateDB() {
	conn = testDB.getConnection();
	// This should drop all database objects, as long as they were all created by the current database user
	// They should be, since they were all created during a previous test.
	await conn.none('DROP OWNED BY current_user;');
	await createSchema(conn);
}

mocha.before(() => {
	connectTestDB();
});

mocha.beforeEach(async () => {
	await recreateDB();
});

mocha.after(() => {
	stopDB();
});

module.exports = {
	recreateDB,
	testDB
};

