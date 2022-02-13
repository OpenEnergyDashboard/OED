/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const Baseline = require('../../models/Baseline');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const Unit = require('../../models/Unit');
const moment = require('moment');
const Point = require('../../models/Point');
const gps = new Point(90, 45);

mocha.describe('Baselines', () => {
	mocha.it('can be saved and retrieved', async () => {
		conn = testDB.getConnection();
		// Need a meter in the database. Need the unit for the meter's unitId and defaultGraphicUnit.
		const unit = new Unit(undefined, 'Unit', 'Unit Id', Unit.unitRepresentType.UNUSED, 1000, 
								Unit.unitType.UNIT, 1, 'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note')
		const meter = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, null, gps, 'Meter', null, null, false, 
								false, '00:00:00', '23:59:59.999999', 0, 0, 1, 'increasing', false, 0.0, moment(0), moment(0), 1, 1);
		await unit.insert(conn);
		await meter.insert(conn);
		const reading = new Reading(
			meter.id,
			1,
			moment('1950-01-01'),
			moment('1950-02-01')
		);
		await reading.insert(conn);
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
		await baseline.insert(conn);
		const retrievedBaselines = await Baseline.getAllForMeterID(meter.id, conn);
		// The query returns an array. It should contain one entry
		expect(retrievedBaselines.length).to.equal(1);
		expect(retrievedBaselines[0]).to.deep.equal(baseline);
	});
});
