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
const Unit = require('../../models/Unit');
const Conversion = require('../../models/Conversion');
const { insertSpecialUnits, insertSpecialConversions } = require('../../data/automatedTestingData.js');
const { redoCik } = require('../../services/graph/redoCik');

mocha.describe('Compare readings', () => {
	let meter, graphicUnitId, conversionSlope, conn;
	const prevStart = moment('2018-01-01');
	const prevEnd = prevStart.clone().add(1, 'day'); // 2018-01-02
	const currStart = prevStart.clone().add(5, 'day'); // 2018-01-06
	const currEnd = currStart.clone().add(1, 'day'); // 2018-01-07
	const shift = moment.duration(5, 'days');

	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
		await Unit.insertStandardUnits(conn);
		await Conversion.insertStandardConversions(conn);
		await insertSpecialUnits(conn);
		await insertSpecialConversions(conn);
		await redoCik(conn);
		// Make the meter be a kWh meter.
		const meterUnitId = (await Unit.getByName('Electric_utility', conn)).id;
		await new Meter(undefined, 'Meter', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, meterUnitId, meterUnitId).insert(conn);
		meter = await Meter.getByName('Meter', conn);
		await Reading.insertAll([
			new Reading(meter.id, 1, prevStart, prevEnd),
			new Reading(meter.id, 10, currStart, currEnd)
		], conn);
		// Make the graphic unit be MegaJoules.
		graphicUnitId = (await Unit.getByName('MJ', conn)).id;
		// The conversion should be 3.6 from kWh -> MJ.
		conversionSlope = 3.6;
	});

	// TODO test readings, units.

	mocha.it('Works for meters', async () => {
		const result = await Reading.getMeterCompareReadings([meter.id], graphicUnitId, currStart, currEnd, shift, conn);
		expect(result).to.deep.equal({ [meter.id]: { curr_use: 10 * conversionSlope, prev_use: 1 * conversionSlope } });
	});

	mocha.it('Works for groups', async () => {
		await new Group(undefined, 'Group').insert(conn);
		const group = await Group.getByName('Group', conn);
		await group.adoptMeter(meter.id, conn);
		const result = await Reading.getGroupCompareReadings([group.id], graphicUnitId, currStart, currEnd, shift, conn);
		expect(result).to.deep.equal({ [group.id]: { curr_use: 10 * conversionSlope, prev_use: 1 * conversionSlope } });
	});
});
