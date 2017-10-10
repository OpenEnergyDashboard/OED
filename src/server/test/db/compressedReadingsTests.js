/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
	});

	mocha.it('compresses readings', async () => {
		const reading1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 200, timestamp2, timestamp3);
		const reading3 = new Reading(meter.id, 300, timestamp3, timestamp4);
		await Reading.insertAll([reading1, reading2, reading3]);

		// Compress the three points to two points.
		const compressedReadings = await Reading.getCompressedReadings([meter.id], timestamp1, timestamp4, 2);
		expect(compressedReadings[meter.id]).to.have.lengthOf(2);
		const expectedFirstCompressedRate = ((reading1.reading) + (reading2.reading * 0.5)) / 1.5;
		expect(compressedReadings[meter.id][0].reading_rate).to.be.closeTo(expectedFirstCompressedRate, 0.0001);
		const expectedSecondCompressedRate = ((reading2.reading * 0.5) + (reading3.reading)) / 1.5;
		expect(compressedReadings[meter.id][1].reading_rate).to.be.closeTo(expectedSecondCompressedRate, 0.0001);
	});

	mocha.it('compresses readings with a gap', async () => {
		const reading1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 200, timestamp2, timestamp3);
		const reading3 = new Reading(meter.id, 300, timestamp4, timestamp5);
		await Reading.insertAll([reading1, reading2, reading3]);

		// Compress the three points to two points.
		const compressedReadings = await Reading.getCompressedReadings([meter.id], timestamp1, timestamp5, 2);
		chai.expect(compressedReadings[meter.id]).to.have.lengthOf(2);
		const expectedFirstCompressedRate = ((reading1.reading) + (reading2.reading)) / 2;
		chai.expect(compressedReadings[meter.id][0].reading_rate).to.be.closeTo(expectedFirstCompressedRate, 0.0001);
		const expectedSecondCompressedRate = reading3.reading;
		chai.expect(compressedReadings[meter.id][1].reading_rate).to.be.closeTo(expectedSecondCompressedRate, 0.0001);
	});

	mocha.it('compresses readings that overlap an end point', async () => {
		const reading1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 200, timestamp2, timestamp3);
		await Reading.insertAll([reading1, reading2]);
		const startTimestamp = timestamp1.clone().add(30, 'minutes');
		const endTimestamp = timestamp3;

		const compressedReadings = await Reading.getCompressedReadings([meter.id], startTimestamp, endTimestamp, 1);
		// The compression rate should weight the first reading half as much as the second one because its intersect time is half as long.
		const expectedFirstCompressedRate = ((0.5 * reading1.reading) + reading2.reading) / 1.5;
		expect(compressedReadings[meter.id][0].reading_rate).to.be.closeTo(expectedFirstCompressedRate, 0.0001);
	});

	mocha.it('compresses readings for multiple meters at once', async () => {
		await new Meter(undefined, 'Meter2', null, false, Meter.type.MAMAC).insert();
		await new Meter(undefined, 'Meter3', null, false, Meter.type.MAMAC).insert();
		const meter2 = await Meter.getByName('Meter2');
		const meter3 = await Meter.getByName('Meter3');
		const readingMeter1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const readingMeter2 = new Reading(meter2.id, 200, timestamp1, timestamp2);
		const readingMeter3 = new Reading(meter3.id, 300, timestamp1, timestamp2);
		await Reading.insertAll([readingMeter1, readingMeter2, readingMeter3]);
		const compressedReadings = await Reading.getCompressedReadings([meter.id, meter2.id], null, null, 1);
		expect(Object.keys(compressedReadings)).to.have.lengthOf(2);
		expect(compressedReadings[meter.id]).to.have.lengthOf(1);
		expect(compressedReadings[meter2.id]).to.have.lengthOf(1);
		expect(compressedReadings[meter.id][0].reading_rate).to.be.closeTo(readingMeter1.reading, 0.0001);
		expect(compressedReadings[meter2.id][0].reading_rate).to.be.closeTo(readingMeter2.reading, 0.0001);
	});

	mocha.it('returns no readings when none exist', async () => {
		const result = await Reading.getCompressedReadings([meter.id]);

		expect(result).to.deep.equal({ [meter.id]: [] });
	});
});
