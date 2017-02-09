const pgp = require('pg-promise')();
const path = require('path');
const config = require('../config');

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

module.exports = {
	db: db,
	sqlFile: sqlFile
};
