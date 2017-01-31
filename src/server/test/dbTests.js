const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const config = require('../config');

// This swaps us to the test database for running test.
// TODO: Fix up configuration between different environments. Maybe use the config npm package.

config.database = {
	user: process.env.DB_TEST_USER || process.env.DB_USER,
	database: process.env.DB_TEST_DATABASE,
	password: process.env.DB_TEST_PASSWORD || process.env.DB_PASSWORD,
	host: process.env.DB_TEST_HOST || process.env.DB_HOST,
	port: process.env.DB_TEST_PORT || process.env.DB_PORT
};

const db = require('../models/database').db;
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const mocha = require('mocha');

function recreateDB() {
	return db.none('DROP TABLE IF EXISTS readings')
		.then(() => db.none('DROP TABLE IF EXISTS meters'))
		.then(Meter.createTable)
		.then(Reading.createTable);
}

mocha.describe('Database Tests', () => {
	mocha.beforeEach(recreateDB);

	mocha.it('saves and retrieves a meter', () => {
		const meter = new Meter(undefined, 'Meter', null);
		const getMeter = meter.insert()
			.then(() => Meter.getByName(meter.name));
		return chai.expect(getMeter).to.eventually.have.property('name', meter.name);
	});
});
