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

mocha.describe('Aggregate Readings', () => {
	mocha.beforeEach(recreateDB);

	let meter;
	const timestamp1 = moment('2017-01-01');
	const timestamp2 = timestamp1.clone().add(1, 'hour');
	const timestamp3 = timestamp2.clone().add(1, 'hour');
	const timestamp4 = timestamp3.clone().add(1, 'hour');
	const timestamp5 = timestamp4.clone().add(1, 'hour');

	mocha.beforeEach(() => db.task(async t => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert(t);
		meter = await Meter.getByName('Meter', t);
	}));

	mocha.it('aggregate readings with no specified time interval', () => db.task(async t => {
		const reading1 = new Reading(meter.id, 100, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 200, timestamp2, timestamp3);
		const reading3 = new Reading(meter.id, 300, timestamp3, timestamp4);
		const reading4 = new Reading(meter.id, 400, timestamp4, timestamp5);
		await Reading.insertAll([reading1, reading2, reading3, reading4], t);

		const aggregateReadings = await Reading.getAggregateReadings([meter.id], moment.duration(2, 'h'));
		expect(aggregateReadings[meter.id]).to.have.lengthOf(2);
		const expectedFirstCompressedRate = reading1.reading + reading2.reading;
		expect(aggregateReadings[meter.id][0].reading_sum).to.equal(expectedFirstCompressedRate);
		const expectedSecondCompressedRate = reading3.reading + reading4.reading;
		expect(aggregateReadings[meter.id][1].reading_sum).to.equal(expectedSecondCompressedRate);
	}));

	mocha.it('aggregate readings with time interval', () => db.task(async t => {
		const reading1 = new Reading(meter.id, 10, timestamp1, timestamp2);
		const reading2 = new Reading(meter.id, 100, timestamp2, timestamp3);
		const reading3 = new Reading(meter.id, 1000, timestamp3, timestamp4);
		const reading4 = new Reading(meter.id, 400, timestamp4, timestamp5);
		await Reading.insertAll([reading1, reading2, reading3, reading4], t);

		const startTimestamp = timestamp1.clone().add(30, 'minutes');
		const endTimestamp = startTimestamp.clone().add(2, 'hours');
		const aggregateReadings = await Reading.getAggregateReadings([meter.id], moment.duration(2, 'h'), startTimestamp, endTimestamp);
		expect(aggregateReadings[meter.id]).to.have.lengthOf(1);
		const expectedFirstCompressedRate = (reading1.reading / 2) + reading2.reading + (reading3.reading / 2);
		expect(aggregateReadings[meter.id][0].reading_sum).to.equal(expectedFirstCompressedRate);
	}));
});
