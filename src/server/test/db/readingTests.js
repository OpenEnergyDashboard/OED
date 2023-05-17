/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This class is for testing meter readings.
 */
const { mocha, expect, testDB } = require('../common');
const moment = require('moment');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const Point = require('../../models/Point');
const gps = new Point(90, 45);

mocha.describe('Readings', () => {
	let meter;
	mocha.beforeEach(async () => {
		const conn = testDB.getConnection();
		// Does not set may meter values but okay since getting readings directly.
		await new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
		meter = await Meter.getByName('Meter', conn);
	});

	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		// Need to work in UTC time since that is what the database returns and comparing
		// to database values. Done in all moment objects in these tests.
		const startTimestamp = moment.utc('2017-01-01');
		const endTimestamp = moment.utc('2017-01-01').add(1, 'hour');
		const readingPreInsert = new Reading(meter.id, 10, startTimestamp, endTimestamp);
		await readingPreInsert.insert(conn);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id, conn);
		expect(retrievedReadings).to.have.lengthOf(1);
		const readingPostInsert = retrievedReadings[0];
		expect(readingPostInsert.startTimestamp.isSame(startTimestamp)).to.equal(true);
		expect(readingPostInsert.endTimestamp.isSame(endTimestamp)).to.equal(true);
		expect(readingPostInsert).to.have.property('reading', readingPreInsert.reading);
	});
	mocha.it('can be saved and retrieved with floating point values', async () => {
		const conn = testDB.getConnection();
		const startTimestamp = moment.utc('2017-01-01');
		const endTimestamp = moment.utc('2017-01-01').add(1, 'hour');
		const readingPreInsert = new Reading(meter.id, 3.5, startTimestamp, endTimestamp);
		await readingPreInsert.insert(conn);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id, conn);
		expect(retrievedReadings).to.have.lengthOf(1);
		const readingPostInsert = retrievedReadings[0];
		expect(readingPostInsert.startTimestamp.isSame(startTimestamp)).to.equal(true);
		expect(readingPostInsert.endTimestamp.isSame(endTimestamp)).to.equal(true);
		expect(readingPostInsert).to.have.property('reading', readingPreInsert.reading);
	});
	mocha.it('can be saved in bulk', async () => {
		const conn = testDB.getConnection();
		const startTimestamp1 = moment.utc('2017-01-01');
		const endTimestamp1 = moment.utc(startTimestamp1).add(1, 'hour');
		const startTimestamp2 = moment.utc(endTimestamp1).add(1, 'hour');
		const endTimestamp2 = moment.utc(startTimestamp2).add(1, 'hour');
		const reading1 = new Reading(meter.id, 1, startTimestamp1, endTimestamp1);
		const reading2 = new Reading(meter.id, 1, startTimestamp2, endTimestamp2);
		await Reading.insertAll([reading1, reading2], conn);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id, conn);
		expect(retrievedReadings).to.have.length(2);
	});
	mocha.it('can be saved/updated in bulk', async () => {
		const conn = testDB.getConnection();
		const startTimestamp1 = moment.utc('2017-01-01');
		const endTimestamp1 = moment.utc(startTimestamp1).add(1, 'hour');
		const startTimestamp2 = moment.utc(endTimestamp1).add(1, 'hour');
		const endTimestamp2 = moment.utc(startTimestamp2).add(1, 'hour');
		const reading1 = new Reading(meter.id, 1, startTimestamp1, endTimestamp1);
		const reading2 = new Reading(meter.id, 1, startTimestamp2, endTimestamp2);
		// Insert reading 1 (so it will be updated)
		await reading1.insert(conn);
		const reading1Updated = new Reading(meter.id, 2, startTimestamp1, endTimestamp1);
		await Reading.insertOrUpdateAll([reading1Updated, reading2], conn);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id, conn);
		expect(retrievedReadings).to.have.length(2);
	});
	mocha.it('can keep any data already in the DB', async () => {
		const conn = testDB.getConnection();
		const startTimestamp = moment.utc('2018-01-01');
		const endTimestamp = moment.utc(startTimestamp).add(1, 'hour');
		const reading = new Reading(meter.id, 1, startTimestamp, endTimestamp);
		await reading.insert(conn);
		const newReading = new Reading(meter.id, 2, startTimestamp, endTimestamp);
		await Reading.insertOrIgnoreAll([newReading], conn);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id, conn);
		expect(retrievedReadings).to.have.length(1);
		const retrievedReading = retrievedReadings[0];
		expect(retrievedReading.startTimestamp.isSame(startTimestamp)).to.equal(true);
		expect(retrievedReading.endTimestamp.isSame(endTimestamp)).to.equal(true);
		expect(retrievedReading.reading).to.equal(1);
	});
});
