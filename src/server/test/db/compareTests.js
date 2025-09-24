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
const { insertStandardUnits, insertStandardConversions } = require('../../util/insertData');
const { insertSpecialUnits, insertSpecialConversions } = require('../../data/automatedTestingData');
const { redoCik } = require('../../services/graph/redoCik');
const { refreshAllReadingViews } = require('../../services/refreshAllReadingViews');

mocha.describe('Compare readings', () => {
	let meter, graphicUnitId, conversionSlope, conn;
	// The tests work if utc or not.
	const prevStart = moment.utc('2018-01-01');
	const prevEnd = prevStart.clone().add(1, 'day'); // 2018-01-02
	const currStart = prevStart.clone().add(5, 'day'); // 2018-01-06
	const currEnd = currStart.clone().add(1, 'day'); // 2018-01-07
	const shift = moment.duration(5, 'days');

	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
		await insertStandardUnits(conn);
		await insertStandardConversions(conn);
		await insertSpecialUnits(conn);
		await insertSpecialConversions(conn);
		await redoCik(conn);
		// Make the meter be a kWh meter.
		const meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
		await new Meter(
			undefined, // id
			'Meter', // name
			null, // URL
			false, // enabled
			true, // displayable
			Meter.type.OTHER, // type
			'CST', // timezone
			undefined, // gps
			undefined, // identifier
			undefined, // note
			undefined, // area
			undefined, // cumulative
			undefined, //cumulativeReset
			undefined, // cumulativeResetStart
			undefined, // cumulativeResetEnd
			undefined, // readingGap
			undefined, // readingVariation
			undefined, //readingDuplication
			undefined, // timeSort
			true, // endOnlyTime
			undefined, // reading
			undefined, // startTimestamp
			undefined, // endTimestamp
			undefined, // previousEnd
			meterUnitId, // unit
			meterUnitId, // default graphic unit
			undefined, // area unit
			undefined // reading frequency
		).insert(conn);
		meter = await Meter.getByName('Meter', conn);
		await Reading.insertAll([
			new Reading(meter.id, 1, prevStart, prevEnd),
			new Reading(meter.id, 10, currStart, currEnd)
		], conn);
		// Make the graphic unit be MegaJoules.
		graphicUnitId = (await Unit.getByName('MJ', conn)).id;
		// The conversion should be 3.6 from kWh -> MJ.
		conversionSlope = 3.6;
		await refreshAllReadingViews();
	});

	// TODO test readings, units.

	mocha.it('Works for meters', async () => {
		const result = await Reading.getMeterCompareReadings([meter.id], graphicUnitId, currStart, currEnd, shift, conn);
		expect(result).to.have.property(`${meter.id}`).to.have.property('curr_use').to.be.closeTo(10 * conversionSlope, 0.0000001);
		expect(result).to.have.property(`${meter.id}`).to.have.property('prev_use').to.be.closeTo(1 * conversionSlope, 0.0000001);
	});

	mocha.it('Works for groups', async () => {
		await new Group(undefined, 'Group').insert(conn);
		const group = await Group.getByName('Group', conn);
		await group.adoptMeter(meter.id, conn);
		const result = await Reading.getGroupCompareReadings([group.id], graphicUnitId, currStart, currEnd, shift, conn);
		expect(result).to.have.property(`${group.id}`).to.have.property('curr_use').to.be.closeTo(10 * conversionSlope, 0.0000001);
		expect(result).to.have.property(`${group.id}`).to.have.property('prev_use').to.be.closeTo(1 * conversionSlope, 0.0000001);
	});
});
