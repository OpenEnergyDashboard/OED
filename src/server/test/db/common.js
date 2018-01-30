/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('../../config');
const { log, LogLevel } = require('../../log');

// This swaps us to the test database for running test.
// TODO: Fix up configuration between different environments. Maybe use the config npm package.

config.database = {
	user: process.env.OED_DB_TEST_USER || process.env.OED_DB_USER,
	database: process.env.OED_DB_TEST_DATABASE,
	password: process.env.OED_DB_TEST_PASSWORD || process.env.OED_DB_PASSWORD,
	host: process.env.OED_DB_TEST_HOST || process.env.OED_DB_HOST,
	port: process.env.OED_DB_TEST_PORT || process.env.OED_DB_PORT
};

// Disable logging during tests.
// TODO: Move logging disabling to a better place.
log.level = LogLevel.SILENT;

const { db, createSchema } = require('../../models/database');

async function recreateDB() {
	// This should drop all database objects, as long as they were all created by the current database user
	// They should be, since they were all created during a previous test.
	await db.none('DROP OWNED BY current_user;');
	await createSchema();
}

module.exports.recreateDB = recreateDB;
