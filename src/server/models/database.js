/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');
const { log } = require('../log');

/**
 * SQL file cache (safe, lazy-loaded)
 */
const sqlFilesDir = path.join(__dirname, '..', 'sql');
const loadedSqlFiles = {};

/**
 * Load SQL file safely
 */
function sqlFile(filePath) {
	const sanitizedPath = filePath.replace(/\.\./g, '');
	const resolvedPath = path.resolve(sqlFilesDir, sanitizedPath);

	const base = path.resolve(sqlFilesDir);
	if (!resolvedPath.startsWith(base)) {
		log.error(`Path traversal detected: ${resolvedPath}`);
		throw new Error('Invalid SQL file path');
	}

	if (!loadedSqlFiles[resolvedPath]) {
		const pgp = require('pg-promise')();
		loadedSqlFiles[resolvedPath] = new pgp.QueryFile(resolvedPath, {
			minify: true
		});
	}

	return loadedSqlFiles[resolvedPath];
}

/**
 * Schema creation (PURE ORCHESTRATION ONLY)
 * NOTE: models MUST NOT import db.js anywhere.
 */
async function createSchema(conn) {
	// IMPORTANT: require models here ONLY (no db.js imports allowed inside models)

	const Unit = require('./Unit');
	const Conversion = require('./Conversion');
	const Cik = require('./Cik');

	const Meter = require('./Meter');
	const Reading = require('./Reading');
	const User = require('./User');
	const Group = require('./Group');
	const Preferences = require('./Preferences');

	const Configfile = require('./obvius/Configfile');
	const Migration = require('./Migration');
	const LogEmail = require('./LogEmail');
	const LogMsg = require('./LogMsg');

	const Baseline = require('./Baseline');
	const Map = require('./Map');

	// ----------------------------
	// Schema creation order
	// ----------------------------

	await Unit.createUnitTypesEnum(conn);
	await Unit.createAreaUnitTypesEnum(conn);
	await Unit.createDisplayableTypesEnum(conn);
	await Unit.createDisableChecksTypesEnum(conn);
	await Unit.createUnitRepresentTypesEnum(conn);

	await Unit.createTable(conn);
	await Conversion.createTable(conn);
	await Cik.createTable(conn);

	await Meter.createMeterTypesEnum(conn);
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
	await LogMsg.createLogMsgTypeEnum(conn);
	await LogMsg.createTable(conn);

	await Reading.createReadingsMaterializedViews(conn);
	await Reading.createCompareReadingsFunction(conn);
	await Reading.create3DReadingsFunction(conn);

	await Baseline.createTable(conn);
	await Map.createTable(conn);

	await conn.none(sqlFile('baseline/create_function_get_average_reading.sql'));

	await Configfile.createTable(conn);
}

module.exports = {
	sqlFile,
	createSchema
};