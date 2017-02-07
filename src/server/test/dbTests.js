const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

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

const { db, sqlFile } = require('../models/database');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const mocha = require('mocha');

function recreateDB() {
	return db.none('DROP TABLE IF EXISTS readings')
		.then(() => db.none('DROP TABLE IF EXISTS meters'))
		.then(() => db.none('DROP TYPE IF EXISTS meter_type'))
		.then(() => db.none(sqlFile('meter/create_meter_types_enum.sql')))
		.then(Meter.createTable)
		.then(Reading.createTable)
		.then(() => db.none(sqlFile('reading/create_function_get_compressed_readings.sql')));
}

mocha.describe('Database Tests', () => {
	mocha.beforeEach(recreateDB);

	mocha.it('can use the default connection in methods', () => new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert()
			.catch(() => chai.fail()));
	// These tests use ES6 generator callbacks, which are supported by pg-promise's .task().
	mocha.it('saves and retrieves a meter', () => db.task(function* runTest(t) {
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC);
		yield meterPreInsert.insert(t);
		const meterPostInsert = yield Meter.getByName(meterPreInsert.name, t);
		chai.expect(meterPostInsert).to.have.property('name', meterPreInsert.name);
	}));

	mocha.it('saves and retrieves a reading', () => db.task(function* runTest(t) {
		yield new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert(t);
		const meter = yield Meter.getByName('Meter', t);
		const startTimestamp = moment('2017-01-01');
		const endTimestamp = moment('2017-01-01').add(1, 'hour');
		const readingPreInsert = new Reading(meter.id, 10, startTimestamp.toDate(), endTimestamp.toDate());
		yield readingPreInsert.insert(t);
		const retrievedReadings = yield Reading.getAllByMeterID(meter.id, t);
		chai.expect(retrievedReadings).to.have.lengthOf(1);
		const readingPostInsert = retrievedReadings[0];
		chai.expect(readingPostInsert.startTimestamp.getTime()).to.equal(startTimestamp.toDate().getTime());
		chai.expect(readingPostInsert.endTimestamp.getTime()).to.equal(endTimestamp.toDate().getTime());
		chai.expect(readingPostInsert).to.have.property('reading', readingPreInsert.reading);
	}));

	mocha.it('compresses readings', () => db.task(function* runTest(t) {
		yield new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert(t);
		const meter = yield Meter.getByName('Meter', t);
		const timestamp1 = moment('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'hour');
		const timestamp3 = timestamp2.clone().add(1, 'hour');
		const timestamp4 = timestamp3.clone().add(1, 'hour');
		const reading1 = new Reading(meter.id, 100, timestamp1.toDate(), timestamp2.toDate());
		const reading2 = new Reading(meter.id, 200, timestamp2.toDate(), timestamp3.toDate());
		const reading3 = new Reading(meter.id, 300, timestamp3.toDate(), timestamp4.toDate());
		yield Reading.insertAll([reading1, reading2, reading3], t);

		// Compress the three points to two points.
		const compressedReadings = yield Reading.getCompressedReadings(meter.id, timestamp1.toDate(), timestamp4.toDate(), 2, t);
		chai.expect(compressedReadings).to.have.lengthOf(2);
		const expectedFirstCompressedRate = ((reading1.reading) + (reading2.reading * 0.5)) / 1.5;
		chai.expect(compressedReadings[0].reading_rate).to.be.closeTo(expectedFirstCompressedRate, 0.0001);
		const expectedSecondCompressedRate = ((reading2.reading * 0.5) + (reading3.reading)) / 1.5;
		chai.expect(compressedReadings[1].reading_rate).to.be.closeTo(expectedSecondCompressedRate, 0.0001);
	}));

	mocha.it('compresses readings with a gap', () => db.task(function* runTest(t) {
		yield new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert(t);
		const meter = yield Meter.getByName('Meter', t);
		const timestamp1 = moment('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'hour');
		const timestamp3 = timestamp2.clone().add(1, 'hour');
		const timestamp4 = timestamp3.clone().add(1, 'hour');
		const timestamp5 = timestamp4.clone().add(1, 'hour');
		const reading1 = new Reading(meter.id, 100, timestamp1.toDate(), timestamp2.toDate());
		const reading2 = new Reading(meter.id, 200, timestamp2.toDate(), timestamp3.toDate());
		const reading3 = new Reading(meter.id, 300, timestamp4.toDate(), timestamp5.toDate());
		yield Reading.insertAll([reading1, reading2, reading3], t);

		// Compress the three points to two points.
		const compressedReadings = yield Reading.getCompressedReadings(meter.id, timestamp1.toDate(), timestamp5.toDate(), 2, t);
		chai.expect(compressedReadings).to.have.lengthOf(2);
		const expectedFirstCompressedRate = ((reading1.reading) + (reading2.reading)) / 2;
		chai.expect(compressedReadings[0].reading_rate).to.be.closeTo(expectedFirstCompressedRate, 0.0001);
		const expectedSecondCompressedRate = reading3.reading;
		chai.expect(compressedReadings[1].reading_rate).to.be.closeTo(expectedSecondCompressedRate, 0.0001);
	}));
});
