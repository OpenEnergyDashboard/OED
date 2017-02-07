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

const { db, sqlFile } = require('../../models/database');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');

function recreateDB() {
	return db.none('DROP TABLE IF EXISTS readings')
		.then(() => db.none('DROP TABLE IF EXISTS meters'))
		.then(() => db.none('DROP TYPE IF EXISTS meter_type'))
		.then(() => db.none(sqlFile('meter/create_meter_types_enum.sql')))
		.then(Meter.createTable)
		.then(Reading.createTable)
		.then(() => db.none(sqlFile('reading/create_function_get_compressed_readings.sql')));
}

module.exports.recreateDB = recreateDB;
