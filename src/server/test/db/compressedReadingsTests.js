/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const Group = require('../../models/Group');
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

	mocha.describe('With groups, meters, and readings set up', async () => {
		let meter2;
		const startTimestamp = moment('2017-01-01');
		const endTimestamp = moment('2017-01-01').add(1, 'hour');
		const readingValue = 10;
		mocha.beforeEach(async () => {
			// Groups A and B will each contain a meter
			const groupA = new Group(undefined, 'A');
			const groupB = new Group(undefined, 'B');
			// Group C will contain A and B
			const groupC = new Group(undefined, 'C');
			await Promise.all([groupA, groupB, groupC].map(group => group.insert()));

			// Create and get a handle to a new meter
			await new Meter(undefined, 'Meter2', null, false, Meter.type.MAMAC).insert();
			meter2 = await Meter.getByName('Meter2');

			// Place meters & groups in hierarchy
			await groupA.adoptMeter(meter.id);
			await groupB.adoptMeter(meter2.id);
			await groupC.adoptGroup(groupA.id);
			await groupC.adoptGroup(groupB.id);

			// Add some readings to the meters
			const reading1 = new Reading(meter.id, readingValue, startTimestamp, endTimestamp);
			const reading2 = new Reading(meter2.id, readingValue, startTimestamp, endTimestamp);
			await Reading.insertAll([reading1, reading2]);
		});
		mocha.it('can get readings from a group containing meters', async () => {
			const groupA = await Group.getByName('A');
			const actualReadings = await Reading.getCompressedGroupReadings([groupA.id], null, null, 1);
			expect(actualReadings[groupA.id]).to.have.lengthOf(1);
			expect(actualReadings[groupA.id][0].start_timestamp.isSame(startTimestamp)).to.equal(true);
			expect(actualReadings[groupA.id][0].end_timestamp.isSame(endTimestamp)).to.equal(true);
			expect(actualReadings[groupA.id][0].reading_rate).to.equal(readingValue);
		});
		mocha.it('can get readings from a group containing groups containing meters', async () => {
			const groupC = await Group.getByName('C');
			const actualReadings = await Reading.getCompressedGroupReadings([groupC.id], null, null, 1);
			expect(actualReadings[groupC.id]).to.have.lengthOf(1);
			expect(actualReadings[groupC.id][0].start_timestamp.isSame(startTimestamp)).to.equal(true);
			expect(actualReadings[groupC.id][0].end_timestamp.isSame(endTimestamp)).to.equal(true);
			expect(actualReadings[groupC.id][0].reading_rate).to.equal(readingValue * 2);
		});
	});
});
