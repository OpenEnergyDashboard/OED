/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const Baseline = require('../../models/Baseline');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const day = require('day');
const Point = require('../../models/Point');
const gps = new Point(90, 45);

mocha.describe('Baselines', () => {
	mocha.it('can be saved and retrieved', async () => {
		conn = testDB.getConnection();
		// Need a meter in the database
		const meter = new Meter(undefined, 'Larry', null, false, true, Meter.type.MAMAC, null, gps);
		await meter.insert(conn);
		const reading = new Reading(
			meter.id,
			1,
			day('1950-01-01'),
			day('1950-02-01')
		);
		await reading.insert(conn);
		const applyStart = day('1970-01-01 00:01:00');
		const applyEnd = day('2069-12-31 00:01:00');
		const calcStart = day('1950-01-01 00:01:00');
		const calcEnd = day('1950-12-31 00:01:00');
		const baseline = new Baseline(
			meter.id,
			applyStart,
			applyEnd,
			calcStart,
			calcEnd,
			'a note'
		);
		await baseline.insert(conn);
		const retrievedBaselines = await Baseline.getAllForMeterID(meter.id, conn);
		// The query returns an array. It should contain one entry
		expect(retrievedBaselines.length).to.equal(1);
		expect(retrievedBaselines[0]).to.deep.equal(baseline);
	});
});
