/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const pgp = require('pg-promise')({
	// This sets the style of returned durations so that Moment can parse them
	connect({ client, useCount }) {
		// Only set the style on fresh connections
		if (useCount === 0) {
			client.query('SET intervalStyle = iso_8601');
		}
	}
});

const path = require('path');
const patchMomentType = require('./patch-moment-type');
const patchPointType = require('./patch-point-type');

patchMomentType(pgp);
patchPointType(pgp);

/**
 * Create a new connection to the database.
 * @returns {pgPromise.IDatabase}
 */
function getDB(connectionParameters) {
	return pgp(connectionParameters);
}

/**
 * Get the name of the database current being worked on.
 * @returns {string}
 */
function getCurrentDB() {
	return currentDB;
}

/**
 * Closes the connection pool and stops pg-promise
 * Only call this to avoid the 30 second script timeout before pg-promise closes connections.
 */
function stopDB() {
	pgp.end();
}

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
 * @param conn the connection to be used.
 * @returns {Promise<void>}
 */
async function createSchema(conn) {
	// We need to require these here instead of at the top to prevent circular dependency issues.
	/* eslint-disable global-require */
	const Meter = require('./Meter');
	const Reading = require('./Reading');
	const User = require('./User');
	const Group = require('./Group');
	const Preferences = require('./Preferences');
	const Configfile = require('./obvius/Configfile');
	const Migration = require('./Migration');
	const LogEmail = require('./LogEmail');
	const Baseline = require('./Baseline');
	const { Map } = require('./Map');
	const Unit = require('./Unit');
	const Conversion = require('./Conversion');
	const Cik = require('./Cik');

	/* eslint-enable global-require */
	await Unit.createUnitTypesEnum(conn);
	await Unit.createAreaUnitTypesEnum(conn);
	await Unit.createDisplayableTypesEnum(conn);
	await Unit.createUnitRepresentTypesEnum(conn);
	await Unit.createTable(conn);
	await Conversion.createTable(conn);
	await Cik.createTable(conn);
	await Meter.createMeterTypesEnum(conn);
	// This sql code creates a function to check meter's timezone.
	// It needs to be called before meter table is created.
	await conn.none(sqlFile('meter/check_timezone.sql'));
	await Meter.createTable(conn);
	await Reading.createReadingLineAccuracyEnum(conn);
	await Reading.createTable(conn);
	await User.createUserTypesEnum(conn);
	await User.createTable(conn);
	await Preferences.createTable(conn);
	await Group.createTables(conn);
	await Migration.createTable(conn);
	await LogEmail.createTable(conn);
	await Reading.createReadingsMaterializedViews(conn);
	await Reading.createCompareReadingsFunction(conn);
	await Baseline.createTable(conn);
	await Map.createTable(conn);
	await conn.none(sqlFile('baseline/create_function_get_average_reading.sql'));
	await Configfile.createTable(conn);
}

module.exports = {
	getDB,
	currentDB: getCurrentDB,
	sqlFile,
	createSchema,
	pgp,
	stopDB
};
