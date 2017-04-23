/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('../../config');

// This swaps us to the test database for running test.
// TODO: Fix up configuration between different environments. Maybe use the config npm package.

config.database = {
	user: process.env.DB_TEST_USER || process.env.DB_USER,
	database: process.env.DB_TEST_DATABASE,
	password: process.env.DB_TEST_PASSWORD || process.env.DB_PASSWORD,
	host: process.env.DB_TEST_HOST || process.env.DB_HOST,
	port: process.env.DB_TEST_PORT || process.env.DB_PORT
};

const { db, createSchema } = require('../../models/database');

function recreateDB() {
	return db.none('DROP TABLE IF EXISTS readings')
		.then(() => db.none('DROP TABLE IF EXISTS meters'))
		.then(() => db.none('DROP TYPE IF EXISTS meter_type'))
		.then(() => db.none('DROP FUNCTION IF EXISTS compressed_readings(INTEGER[], TIMESTAMP, TIMESTAMP, INTEGER);'))
		.then(() => db.none('DROP FUNCTION IF EXISTS barchart_readings(INTEGER[], INTERVAL, TIMESTAMP, TIMESTAMP);'))
		.then(createSchema);
}

module.exports.recreateDB = recreateDB;
