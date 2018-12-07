/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const Group = require('../../models/Group');

const mocha = require('mocha');

mocha.describe('Compare calculation', () => {
	mocha.beforeEach(recreateDB);

	let meter;
	const prevStart = moment('2018-01-01');
	const prevEnd = prevStart.clone().add(1, 'day'); // 2018-01-02
	const currStart = prevStart.clone().add(5, 'day'); // 2018-01-06
	const currEnd = currStart.clone().add(1, 'day'); // 2018-01-07
	const shift = moment.duration(5, 'days')
	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
		await Reading.insertAll([
			new Reading(meter.id, 1, prevStart, prevEnd),
			new Reading(meter.id, 10, currStart, currEnd)
		]);
	});
	mocha.it('Works for meters', async () => {
		const result = await Reading.getCompareReadings([meter.id], currStart, currEnd, shift);
		expect(result).to.deep.equal({[meter.id]: {currentUse: 10, prevUse: 1}});
	});

	mocha.it('Works for groups', async () => {
		await new Group(undefined, 'Group').insert();
		const group = await Group.getByName('Group');
		await group.adoptMeter(meter.id);
		const result = await Reading.getGroupCompareReadings([group.id], currStart, currEnd, shift);
		expect(result).to.deep.equal({[group.id]: {currentUse: 10, prevUse: 1}});
	});
});
