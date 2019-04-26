/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This class is for testing meter readings.  This is done by recreating a DB and then waiting for a meter reading.
 * mocha.its are where expected results are checked.
 */

/**
 * Initial imports.
 */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');

const mocha = require('mocha');

/**
 * Here is where the DB is recreated and meter readings are being retrieved.
 */
mocha.describe('Readings', () => {
	mocha.beforeEach(recreateDB);
	let meter;
	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
	});

	/**
	 * Timestamps are made to get readings and then are stored in readingPostInsert.  Then there is an "expect" to check
	 * if the readingPostInsert has the property of a reading.
	 */
	mocha.it('can be saved and retrieved', async () => {
		const startTimestamp = moment('2017-01-01');
		const endTimestamp = moment('2017-01-01').add(1, 'hour');
		const readingPreInsert = new Reading(meter.id, 10, startTimestamp, endTimestamp);
		await readingPreInsert.insert();
		const retrievedReadings = await Reading.getAllByMeterID(meter.id);
		expect(retrievedReadings).to.have.lengthOf(1);
		const readingPostInsert = retrievedReadings[0];
		expect(readingPostInsert.startTimestamp.isSame(startTimestamp)).to.equal(true);
		expect(readingPostInsert.endTimestamp.isSame(endTimestamp)).to.equal(true);
		expect(readingPostInsert).to.have.property('reading', readingPreInsert.reading);
	});
	/**
	 * Like the test above, timestamps are made and then checked if the expected amount of readings are present.
	 */
	mocha.it('can be saved and retrieved with floating point values', async () => {
		const startTimestamp = moment('2017-01-01');
		const endTimestamp = moment('2017-01-01').add(1, 'hour');
		const readingPreInsert = new Reading(meter.id, 3.5, startTimestamp, endTimestamp);
		await readingPreInsert.insert();
		const retrievedReadings = await Reading.getAllByMeterID(meter.id);
		expect(retrievedReadings).to.have.lengthOf(1);
		const readingPostInsert = retrievedReadings[0];
		expect(readingPostInsert.startTimestamp.isSame(startTimestamp)).to.equal(true);
		expect(readingPostInsert.endTimestamp.isSame(endTimestamp)).to.equal(true);
		expect(readingPostInsert).to.have.property('reading', readingPreInsert.reading);
	});
	mocha.it('can be saved in bulk', async () => {
		const startTimestamp1 = moment('2017-01-01');
		const endTimestamp1 = moment(startTimestamp1).add(1, 'hour');
		const startTimestamp2 = moment(endTimestamp1).add(1, 'hour');
		const endTimestamp2 = moment(startTimestamp2).add(1, 'hour');
		const reading1 = new Reading(meter.id, 1, startTimestamp1, endTimestamp1);
		const reading2 = new Reading(meter.id, 1, startTimestamp2, endTimestamp2);
		await Reading.insertAll([reading1, reading2]);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id);
		expect(retrievedReadings).to.have.length(2);
	});
	/**
	 * This is the same as the mocha.it above, but tests if insertOrUpdateAll returns the expected results.
	 */
	mocha.it('can be saved/updated in bulk', async () => {
		const startTimestamp1 = moment('2017-01-01');
		const endTimestamp1 = moment(startTimestamp1).add(1, 'hour');
		const startTimestamp2 = moment(endTimestamp1).add(1, 'hour');
		const endTimestamp2 = moment(startTimestamp2).add(1, 'hour');
		const reading1 = new Reading(meter.id, 1, startTimestamp1, endTimestamp1);
		const reading2 = new Reading(meter.id, 1, startTimestamp2, endTimestamp2);
		// Insert reading 1 (so it will be updated)
		await reading1.insert();
		const reading1Updated = new Reading(meter.id, 2, startTimestamp1, endTimestamp1);
		await Reading.insertOrUpdateAll([reading1Updated, reading2]);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id);
		expect(retrievedReadings).to.have.length(2);
	});
	mocha.it('can keep any data already in the DB', async () => {
		const startTimestamp = moment('2018-01-01');
		const endTimestamp = moment(startTimestamp).add(1, 'hour');
		const reading = new Reading(meter.id, 1, startTimestamp, endTimestamp);
		await reading.insert();
		const newReading = new Reading(meter.id, 2, startTimestamp, endTimestamp);
		await Reading.insertOrIgnoreAll([newReading]);
		const retrievedReadings = await Reading.getAllByMeterID(meter.id);
		expect(retrievedReadings).to.have.length(1);
		const retrievedReading = retrievedReadings[0];
		expect(retrievedReading.startTimestamp.isSame(startTimestamp)).to.equal(true);
		expect(retrievedReading.endTimestamp.isSame(endTimestamp)).to.equal(true);
		expect(retrievedReading.reading).to.equal(1);
	});
});
