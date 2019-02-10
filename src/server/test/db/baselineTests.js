/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const recreateDB = require('./common').recreateDB;
const Baseline = require('../../models/Baseline');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const mocha = require('mocha');
const moment = require('moment');
mocha.describe('Baselines', () => {
	mocha.beforeEach(recreateDB);
	mocha.it('can be saved and retrieved', async () => {
		// Need a meter in the database
		const meter = new Meter(undefined, 'Larry', null, false, true, Meter.type.MAMAC);
		await meter.insert();
		const reading = new Reading(
			meter.id,
			1,
			moment('1950-01-01'),
			moment('1950-02-01')
		);
		await reading.insert();
		const applyStart = moment('1970-01-01 00:01:00');
		const applyEnd = moment('2069-12-31 00:01:00');
		const calcStart = moment('1950-01-01 00:01:00');
		const calcEnd = moment('1950-12-31 00:01:00');
		const baseline = new Baseline(
			meter.id,
			applyStart,
			applyEnd,
			calcStart,
			calcEnd,
			'a note'
		);
		await baseline.insert();
		const retrievedBaselines = await Baseline.getAllForMeterID(meter.id);
		// The query returns an array. It should contain one entry
		expect(retrievedBaselines.length).to.equal(1);
		expect(retrievedBaselines[0]).to.deep.equal(baseline);
	});
});
