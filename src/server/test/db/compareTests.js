/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const moment = require('moment');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const Group = require('../../models/Group');

mocha.describe('Compare calculation', () => {
	let meter;
	const prevStart = moment('2018-01-01');
	const prevEnd = prevStart.clone().add(1, 'day'); // 2018-01-02
	const currStart = prevStart.clone().add(5, 'day'); // 2018-01-06
	const currEnd = currStart.clone().add(1, 'day'); // 2018-01-07
	const shift = moment.duration(5, 'days');
	mocha.beforeEach(async () => {
		const conn = testDB.getConnection();
		await new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, null).insert(conn);
		meter = await Meter.getByName('Meter', conn);
		await Reading.insertAll([
			new Reading(meter.id, 1, prevStart, prevEnd),
			new Reading(meter.id, 10, currStart, currEnd)
		], conn);
	});
	mocha.it('Works for meters', async () => {
		const conn = testDB.getConnection();
		const result = await Reading.getCompareReadings([meter.id], currStart, currEnd, shift, conn);
		expect(result).to.deep.equal({[meter.id]: {curr_use: 10, prev_use: 1}});
	});

	mocha.it('Works for groups', async () => {
		const conn = testDB.getConnection();
		await new Group(undefined, 'Group').insert(conn);
		const group = await Group.getByName('Group', conn);
		await group.adoptMeter(meter.id, conn);
		const result = await Reading.getGroupCompareReadings([group.id], currStart, currEnd, shift, conn);
		expect(result).to.deep.equal({[group.id]: {curr_use: 10, prev_use: 1}});
	});
});
