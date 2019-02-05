/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const mocha = require('mocha');
const { log, LogLevel } = require('../../log');
const { getDB, createSchema, stopDB } = require('../../models/database');

let testDB;

async function connectTestDB() {
	const testDBConfig = {
		user: process.env.OED_DB_TEST_USER || process.env.OED_DB_USER,
		database: process.env.OED_DB_TEST_DATABASE,
		password: process.env.OED_DB_TEST_PASSWORD || process.env.OED_DB_PASSWORD,
		host: process.env.OED_DB_TEST_HOST || process.env.OED_DB_HOST,
		port: process.env.OED_DB_TEST_PORT || process.env.OED_DB_PORT
	};

	stopDB();
	testDB = getDB(testDBConfig);
}

// Disable logging during tests.
// TODO: Move logging disabling to a better place.
log.level = LogLevel.SILENT;

async function recreateDB() {
	// This should drop all database objects, as long as they were all created by the current database user
	// They should be, since they were all created during a previous test.
	await testDB.none('DROP OWNED BY current_user;');
	await createSchema(testDB);
}

mocha.before(() => {
	connectTestDB();
});

mocha.beforeEach(async () =>{
	await recreateDB();
});

mocha.after(() => {
	stopDB();
});

module.exports.recreateDB = recreateDB;
module.exports.testDB = testDB;
