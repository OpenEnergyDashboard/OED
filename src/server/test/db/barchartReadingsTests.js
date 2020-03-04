/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const moment = require('moment');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');

mocha.describe('Barchart Readings', () => {
	let meter;
	const timestamp1 = moment('2017-01-01');
	const timestamp2 = timestamp1.clone().add(1, 'hour');
	const timestamp3 = timestamp2.clone().add(1, 'hour');
	const timestamp4 = timestamp3.clone().add(1, 'hour');
	const timestamp5 = timestamp4.clone().add(1, 'hour');

	mocha.beforeEach(async () => {
		connectTestDB(); // Debug: see if this helps
		conn = testDB.getConnection();
		await new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC).insert(conn);
		meter = await Meter.getByName('Meter', conn);
	});

	mocha.it('barchart readings with no specified time interval', async () => {
		conn = testDB.getConnection();
		const reading1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 200, timestamp2, timestamp3);
		const reading3 = new Reading(meter.id, 300, timestamp3, timestamp4);
		const reading4 = new Reading(meter.id, 400, timestamp4, timestamp5);
		await Reading.insertAll([reading1, reading2, reading3, reading4], conn);

		// TODO: This is awkward. Is there a better way to have conn as a non-optional
		// without requiring changing EVERY call to getBarchartReadings?
		// If not, well, we need to change every call.
		const barchartReadings = await Reading.getBarchartReadings([meter.id], moment.duration(2, 'h'), null, null, conn);
		expect(barchartReadings[meter.id]).to.have.lengthOf(2);
		const expectedFirstReading = Math.floor(reading1.reading + reading2.reading);
		expect(barchartReadings[meter.id][0].reading_sum).to.equal(expectedFirstReading);
		const expectedSecondReading = Math.floor(reading3.reading + reading4.reading);
		expect(barchartReadings[meter.id][1].reading_sum).to.equal(expectedSecondReading);
	});

	mocha.it('barchart readings with time interval', async () => {
		conn = testDB.getConnection();
		const reading1 = new Reading(meter.id, 10, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 100, timestamp2, timestamp3);
		const reading3 = new Reading(meter.id, 1000, timestamp3, timestamp4);
		const reading4 = new Reading(meter.id, 400, timestamp4, timestamp5);
		await Reading.insertAll([reading1, reading2, reading3, reading4], conn);

		const startTimestamp = timestamp1.clone().add(30, 'minutes');
		const endTimestamp = startTimestamp.clone().add(2, 'hours');
		const barchartReadings = await Reading.getBarchartReadings([meter.id], moment.duration(2, 'h'), startTimestamp, endTimestamp, conn);
		expect(barchartReadings[meter.id]).to.have.lengthOf(1);
		const expectedFirstReading = Math.floor((reading1.reading * 0.5) + reading2.reading + (reading3.reading * 0.5));
		expect(barchartReadings[meter.id][0].reading_sum).to.equal(expectedFirstReading);
	});

	mocha.it('barchart readings with overlapping duration and time interval', async () => {
		conn = testDB.getConnection();
		const reading1 = new Reading(meter.id, 10, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 100, timestamp2, timestamp3);
		const reading3 = new Reading(meter.id, 1000, timestamp3, timestamp4);
		const reading4 = new Reading(meter.id, 400, timestamp4, timestamp5);
		await Reading.insertAll([reading1, reading2, reading3, reading4], conn);

		const startTimestamp = timestamp1.clone().add(15, 'minutes');
		const endTimestamp = startTimestamp.clone().add(50, 'days');
		const barchartReadings = await Reading.getBarchartReadings([meter.id], moment.duration(1, 'h'), startTimestamp, endTimestamp, conn);
		expect(barchartReadings[meter.id]).to.have.lengthOf(4);
		const expectedFirstReading = Math.floor((reading1.reading * 0.75) + (reading2.reading * 0.25));
		expect(barchartReadings[meter.id][0].reading_sum).to.equal(expectedFirstReading);
		const expectedSecondReading = Math.floor((reading2.reading * 0.75) + (reading3.reading * 0.25));
		expect(barchartReadings[meter.id][1].reading_sum).to.equal(expectedSecondReading);
		const expectedThirdReading = Math.floor((reading3.reading * 0.75) + (reading4.reading * 0.25));
		expect(barchartReadings[meter.id][2].reading_sum).to.equal(expectedThirdReading);
		const expectedFourthReading = Math.floor(reading4.reading * 0.75);
		expect(barchartReadings[meter.id][3].reading_sum).to.equal(expectedFourthReading);
	});

	mocha.it('barchart readings with a missing reading', async () => {
		conn = testDB.getConnection();
		const reading1 = new Reading(meter.id, 10, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 100, timestamp2, timestamp3);
		const reading4 = new Reading(meter.id, 400, timestamp4, timestamp5);
		await Reading.insertAll([reading1, reading2, reading4], conn);

		const startTimestamp = timestamp1.clone().add(30, 'minutes');
		const endTimestamp = startTimestamp.clone().add(5, 'hours');
		const barchartReadings = await Reading.getBarchartReadings([meter.id], moment.duration(1, 'h'), startTimestamp, endTimestamp, conn);
		expect(barchartReadings[meter.id]).to.have.lengthOf(4);
		const expectedFirstReading = Math.floor((reading1.reading * 0.5) + (reading2.reading * 0.5));
		expect(barchartReadings[meter.id][0].reading_sum).to.equal(expectedFirstReading);
		const expectedSecondReading = Math.floor(reading2.reading * 0.5);
		expect(barchartReadings[meter.id][1].reading_sum).to.equal(expectedSecondReading);
		const expectedThirdReading = Math.floor(reading4.reading * 0.5);
		expect(barchartReadings[meter.id][2].reading_sum).to.equal(expectedThirdReading);
		const expectedFourthReading = Math.floor(reading4.reading * 0.5);
		expect(barchartReadings[meter.id][3].reading_sum).to.equal(expectedFourthReading);
	});

	mocha.it('barchart readings with a smaller time interval than duration', async () => {
		conn = testDB.getConnection();
		const reading1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 1000, timestamp2, timestamp3);
		await Reading.insertAll([reading1, reading2], conn);

		const startTimestamp = timestamp1.clone().add(30, 'minutes');
		const endTimestamp = startTimestamp.clone().add(15, 'minutes');
		const barchartReadings = await Reading.getBarchartReadings([meter.id], moment.duration(1, 'h'), startTimestamp, endTimestamp, conn);
		expect(barchartReadings[meter.id]).to.have.lengthOf(1);
		const expectedFirstReading = Math.floor(reading1.reading * 0.25);
		expect(barchartReadings[meter.id][0].reading_sum).to.equal(expectedFirstReading);
	});

	mocha.it('barchart readings with multiple meters', async () => {
		conn = testDB.getConnection();
		await new Meter(undefined, 'Meter2', null, false, true, Meter.type.MAMAC).insert(conn);
		await new Meter(undefined, 'Meter3', null, false, true, Meter.type.MAMAC).insert(conn);
		const meter2 = await Meter.getByName('Meter2', conn);
		const meter3 = await Meter.getByName('Meter3', conn);
		const readingMeter1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const readingMeter2 = new Reading(meter2.id, 200, timestamp1, timestamp2);
		const readingMeter3 = new Reading(meter3.id, 300, timestamp1, timestamp2);
		await Reading.insertAll([readingMeter1, readingMeter2, readingMeter3], conn);

		const startTimestamp = timestamp1.clone();
		const endTimestamp = startTimestamp.clone().add(2, 'hours');
		const barchartReadings = await Reading.getBarchartReadings(
			[meter.id, meter2.id, meter3.id],
			moment.duration(1, 'hour'),
			startTimestamp,
			endTimestamp,
			conn
		);
		expect(Object.keys(barchartReadings)).to.have.lengthOf(3);
		expect(barchartReadings[meter.id]).to.have.lengthOf(1);
		expect(barchartReadings[meter2.id]).to.have.lengthOf(1);
		expect(barchartReadings[meter3.id]).to.have.lengthOf(1);
		expect(barchartReadings[meter.id][0].reading_sum).to.equal(readingMeter1.reading);
		expect(barchartReadings[meter2.id][0].reading_sum).to.equal(readingMeter2.reading);
		expect(barchartReadings[meter3.id][0].reading_sum).to.equal(readingMeter3.reading);
	});

	mocha.it('returns correct results when no readings exist', async () => {
		conn = testDB.getConnection();
		const result = await Reading.getBarchartReadings([meter.id], moment.duration(1, 'day'), null, null, conn);
		expect(result).to.deep.equal({ [meter.id]: [] });
	});
});
