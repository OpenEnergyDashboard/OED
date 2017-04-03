/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const pgp = require('pg-promise')();
const path = require('path');
const config = require('../config');

require('./patch-moment-type');

/**
 * The connection to the database
 * @type {pgPromise.IDatabase}
 */
const db = pgp(config.database);

const sqlFilesDir = path.join(__dirname, '..', 'sql');

const loadedSqlFiles = {};

/**
 * Load a QueryFile from the sql directory.
 * The QueryFile is loaded once and subsequently cached, so repeated calls to this method will only create a single
 * QueryFile object. See {@link https://github.com/vitaly-t/pg-promise#query-files}
 * @example
 * 	sqlFile('meter/get_all_meters.sql') // Returns an sql file for getting all meters.
 * @param filePath the path to the sql file, relative to the sql directory
 * @returns {pgPromise.QueryFile}
 */
function sqlFile(filePath) {
	const sqlFilePath = path.join(sqlFilesDir, filePath);
	if (loadedSqlFiles[sqlFilePath] === undefined) {
		loadedSqlFiles[sqlFilePath] = new pgp.QueryFile(path.join(sqlFilesDir, filePath), { minify: true });
	}
	return loadedSqlFiles[sqlFilePath];
}

/**
 * Returns a promise to create the database schema.
 * @return {Promise<void>}
 */
async function createSchema() {
	// We need to require these here instead of at the top to prevent circular dependency issues.
	/* eslint-disable global-require */
	const Meter = require('./Meter');
	const Reading = require('./Reading');
	const User = require('./User');
	const Group = require('./Group');
	/* eslint-enable global-require */
	await Meter.createMeterTypesEnum();
	await Meter.createTable();
	await Reading.createTable();
	await Reading.createCompressedReadingsFunction();
	await User.createTable();
	await Group.createTables();
	await db.none(sqlFile('reading/create_function_get_compressed_readings.sql'));
}

/**
 * Closes the connection pool and stops pg-promise
 * Only call this to avoid the 30 second script timeout before pg-promise closes connections.
 */
function stopDB() {
	pgp.end();
}

module.exports = {
	db,
	sqlFile,
	createSchema,
	pgp,
	stopDB
};
