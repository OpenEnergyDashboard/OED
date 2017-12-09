/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');

const mocha = require('mocha');

mocha.describe('Readings', () => {
	mocha.beforeEach(recreateDB);
	let meter;
	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
	});

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
});
