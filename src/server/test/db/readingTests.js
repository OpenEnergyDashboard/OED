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

mocha.describe('Readings', () => {
	mocha.beforeEach(recreateDB);
	let meter;
	mocha.beforeEach(() => db.task(function* setupTests(t) {
		yield new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert(t);
		meter = yield Meter.getByName('Meter', t);
	}));

	mocha.it('can be saved and retrieved', () => db.task(function* runTest(t) {
		const startTimestamp = moment('2017-01-01');
		const endTimestamp = moment('2017-01-01').add(1, 'hour');
		const readingPreInsert = new Reading(meter.id, 10, startTimestamp, endTimestamp);
		yield readingPreInsert.insert(t);
		const retrievedReadings = yield Reading.getAllByMeterID(meter.id, t);
		expect(retrievedReadings).to.have.lengthOf(1);
		const readingPostInsert = retrievedReadings[0];
		expect(readingPostInsert.startTimestamp.isSame(startTimestamp)).to.equal(true);
		expect(readingPostInsert.endTimestamp.isSame(endTimestamp)).to.equal(true);
		expect(readingPostInsert).to.have.property('reading', readingPreInsert.reading);
	}));
});
