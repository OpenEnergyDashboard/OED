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

	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
	});
	mocha.it('Works', async () => {
		const prevStart = moment('2018-01-01');
		const prevMid = prevStart.clone().add(1, 'day');
		const currStart = prevStart.clone().add(2, 'day');
		const currEnd = currStart.clone().add(1, 'day');
		await Reading.insertAll([
			new Reading(meter.id, 1, prevStart, prevMid),
			new Reading(meter.id, 2, prevMid, currStart),
			new Reading(meter.id, 5, currStart, currEnd)
		]);

		const result = await Reading.getCompareReadings([meter.id], currStart, currEnd, moment.duration(2, 'days'));
		expect(result).to.deep.equal({[meter.id]: {prevUseTotal: 3, prevUseForCurrent: 1, currentUse: 5}});
	});
});
