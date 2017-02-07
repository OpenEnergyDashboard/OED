const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');

const mocha = require('mocha');

mocha.describe('Compressed Readings', () => {
	mocha.beforeEach(recreateDB);

	let meter;
	const timestamp1 = moment('2017-01-01');
	const timestamp2 = timestamp1.clone().add(1, 'hour');
	const timestamp3 = timestamp2.clone().add(1, 'hour');
	const timestamp4 = timestamp3.clone().add(1, 'hour');
	const timestamp5 = timestamp4.clone().add(1, 'hour');

	mocha.beforeEach(() => db.task(function* setupBeforeEach(t) {
		yield new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert(t);
		meter = yield Meter.getByName('Meter', t);
	}));

	mocha.it('compresses readings', () => db.task(function* runTest(t) {
		const reading1 = new Reading(meter.id, 100, timestamp1.toDate(), timestamp2.toDate());
		const reading2 = new Reading(meter.id, 200, timestamp2.toDate(), timestamp3.toDate());
		const reading3 = new Reading(meter.id, 300, timestamp3.toDate(), timestamp4.toDate());
		yield Reading.insertAll([reading1, reading2, reading3], t);

		// Compress the three points to two points.
		const compressedReadings = yield Reading.getCompressedReadings(meter.id, timestamp1.toDate(), timestamp4.toDate(), 2, t);
		expect(compressedReadings).to.have.lengthOf(2);
		const expectedFirstCompressedRate = ((reading1.reading) + (reading2.reading * 0.5)) / 1.5;
		expect(compressedReadings[0].reading_rate).to.be.closeTo(expectedFirstCompressedRate, 0.0001);
		const expectedSecondCompressedRate = ((reading2.reading * 0.5) + (reading3.reading)) / 1.5;
		expect(compressedReadings[1].reading_rate).to.be.closeTo(expectedSecondCompressedRate, 0.0001);
	}));

	mocha.it('compresses readings with a gap', () => db.task(function* runTest(t) {
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

	mocha.it('compresses readings that overlap an end point', () => db.task(function* runTest(t) {
		const reading1 = new Reading(meter.id, 100, timestamp1.toDate(), timestamp2.toDate());
		const reading2 = new Reading(meter.id, 200, timestamp2.toDate(), timestamp3.toDate());
		yield Reading.insertAll([reading1, reading2], t);
		const startTimestamp = timestamp1.clone().add(30, 'minutes');
		const endTimestamp = timestamp3;

		const compressedReadings = yield Reading.getCompressedReadings(meter.id, startTimestamp.toDate(), endTimestamp.toDate(), 1);
		// The compression rate should weight the first reading half as much as the second one because its intersect time is half as long.
		const expectedFirstCompressedRate = ((0.5 * reading1.reading) + reading2.reading) / 1.5;
		expect(compressedReadings[0].reading_rate).to.be.closeTo(expectedFirstCompressedRate, 0.0001);
	}));
});
