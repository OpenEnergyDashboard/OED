/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Tests if the expected properties are the actual results from meters.
 */

const { mocha, expect, testDB } = require('../common');
const Meter = require('../../models/Meter');
const Point = require('../../models/Point');
const moment = require('moment-timezone');
const Unit = require('../../models/Unit');
const gps = new Point(90, 45);

//  TODO add 2 new unit parameters for meters.

/**
 * Checks if the expected meter properties have the actual properties.
 * @param expected expected meter properties
 * @param actual actual meter properties
 */
function expectMetersToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('name', expected.name);
	expect(actual).to.have.property('enabled', expected.enabled);
	expect(actual).to.have.property('type', expected.type);
	expect(actual).to.have.property('gps');
	expect(actual.gps).to.have.property('latitude', expected.gps.latitude);
	expect(actual.gps).to.have.property('longitude', expected.gps.longitude);
	expect(actual).to.have.property('meterTimezone', expected.meterTimezone);
	expect(actual).to.have.property('identifier', expected.identifier);
	expect(actual).to.have.property('note', expected.note);
	expect(actual).to.have.property('area', expected.area);
	expect(actual).to.have.property('cumulative', expected.cumulative);
	expect(actual).to.have.property('cumulativeReset', expected.cumulativeReset);
	expect(actual).to.have.property('cumulativeResetStart', expected.cumulativeResetStart);
	expect(actual).to.have.property('cumulativeResetEnd', expected.cumulativeResetEnd);
	expect(actual).to.have.property('readingGap', expected.readingGap);
	expect(actual).to.have.property('readingVariation', expected.readingVariation);
	expect(actual).to.have.property('readingDuplication', expected.readingDuplication);
	expect(actual).to.have.property('timeSort', expected.timeSort);
	expect(actual).to.have.property('endOnlyTime', expected.endOnlyTime);
	expect(actual).to.have.property('reading', expected.reading);
	expect(actual).to.have.property('startTimestamp', expected.startTimestamp);
	expect(actual).to.have.property('endTimestamp', expected.endTimestamp);
	// TODO save until sure not needed.
	// expect(actual.startTimestamp.isSame(moment.utc(expected.startTimestamp))).to.equal(true);
	// expect(actual.endTimestamp.isSame(moment.utc(expected.endTimestamp))).to.equal(true);
	// Need to work in UTC time since that is what the database returns and comparing
	// to database values. Done in all moment objects in this test.
	// This gets the date/time to be the same but put into UTC.
	expect(actual.previousEnd.isSame(moment.parseZone(expected.previousEnd, true).tz('UTC', true))).to.equal(true);
	expect(actual).to.have.property('unitId', expected.unitId);
	expect(actual).to.have.property('defaultGraphicUnit', expected.defaultGraphicUnit);
	expect(actual).to.have.property('areaUnit', expected.areaUnit);
	expect(actual).to.have.property('readingFrequency');
	expect(actual.readingFrequency.asMilliseconds()).to.equal(expected.readingFrequency.asMilliseconds());
}

mocha.describe('Meters', () => {
	let unitA, unitB;
	mocha.beforeEach(async () => {
		unitA = new Unit(undefined, 'Unit A', 'Unit A Id', Unit.unitRepresentType.UNUSED, 1000,
			Unit.unitType.UNIT, 1, 'Unit A Suffix', Unit.displayableType.ALL, true, 'Unit A Note');
		unitB = new Unit(undefined, 'Unit B', 'Unit B Id', Unit.unitRepresentType.UNUSED, 2000,
			Unit.unitType.UNIT, 2, 'Unit B Suffix', Unit.displayableType.ALL, true, 'Unit B Note');
		const unitC = new Unit(undefined, 'Unit C', 'Unit C Id', Unit.unitRepresentType.UNUSED, 3000,
			Unit.unitType.UNIT, 3, 'Unit C Suffix', Unit.displayableType.ALL, true, 'Unit C Note');
		await Promise.all([unitA, unitB, unitC].map(unit => unit.insert(conn)));
	});

	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC',
			gps, 'Identified', 'notes', 33.5, true, true, '05:05:09', '09:00:01', 0, 0, 1, 'increasing', false,
			25.5, '0001-01-01 23:59:59-05:00', '2020-07-02 01:00:10-06:00', '2020-03-05 02:12:00-06:00', unitA.id,
			unitA.id, Unit.areaUnitType.METERS, '12:34:56');
		await meterPreInsert.insert(conn);
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	mocha.it('can be saved and retrieved with no graphic units', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC',
			gps, 'Identified', 'notes', 33.5, true, true, '05:05:09', '09:00:01', 0, 0, 1, 'increasing', false,
			25.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', -99, -99,
			Unit.areaUnitType.FEET, undefined);
		await meterPreInsert.insert(conn);
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	mocha.it('can be saved, edited, and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC', gps,
			'Identified', 'notes', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59+00:00', '2020-07-02 01:00:10+00:00', '2020-03-05 02:12:00+00:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, '1 day 3 hours 12 minutes');
		await meterPreInsert.insert(conn);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);

		meterPreInsert.name = 'Something Else';
		meterPreInsert.enabled = true;
		meterPreInsert.meterTimezone = 'GMT';
		meterPreInsert.unitId = 3;
		await meterPreInsert.update(conn);
		const meterPostUpdate = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostUpdate);
	});

	mocha.it('can get only enabled meters', async () => {
		const conn = testDB.getConnection();
		// Don't set timestamp values to see if defaults work.
		const enabledMeter = new Meter(undefined, 'EnabledMeter', null, true, true, Meter.type.MAMAC, null, gps,
			'Identified', 'notes', 35.0, true, true, '01:01:25', '00:00:00', 7, 11, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59+00:00', '2020-07-02 01:00:10+00:00', '2020-03-05 02:12:00+00:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const disabledMeter = new Meter(undefined, 'DisabledMeter', null, false, true, Meter.type.MAMAC, null, gps,
			'Identified 1', 'Notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0002-01-01 23:59:59+00:00', '2020-07-02 01:00:10+00:00', '2020-03-05 02:12:00+00:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		await enabledMeter.insert(conn);
		await disabledMeter.insert(conn);
		// set default timestamps for testing.
		disabledMeter.startTimestamp = '1970-01-01 00:00:00+00:00';
		disabledMeter.endTimestamp = '1970-01-01 00:00:00+00:00';
		disabledMeter.previousEnd = '1970-01-01 00:00:00+00:00';

		const enabledMeters = await Meter.getEnabled(conn);
		expect(enabledMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(enabledMeter, enabledMeters[0]);
	});

	mocha.it('can get only visible meters', async () => {
		const conn = testDB.getConnection();
		const visibleMeter = new Meter(undefined, 'VisibleMeter', null, true, true, Meter.type.MAMAC, null, gps,
			'Identified 1', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const invisibleMeter = new Meter(undefined, 'InvisibleMeter', null, true, false, Meter.type.MAMAC, null, gps,
			'Identified 2', 'Notes 2', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0002-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);

		await visibleMeter.insert(conn);
		await invisibleMeter.insert(conn);

		const visibleMeters = await Meter.getDisplayable(conn);
		expect(visibleMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(visibleMeter, visibleMeters[0]);
	});

	mocha.it('can get unit index', async () => {
		const conn = testDB.getConnection();
		const visibleMeter = new Meter(undefined, 'VisibleMeter', null, true, true, Meter.type.MAMAC, null, gps,
			'Identified 1', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		await visibleMeter.insert(conn);

		const actualUnitIndex = await Meter.getUnitIndex(1, conn);
		const expectedUnitIndex = unitA.unitIndex;
		expect(actualUnitIndex).to.be.equal(expectedUnitIndex);
	});

	mocha.it('can get all meter where unitId is not null', async () => {
		const meterA = new Meter(undefined, 'MeterA', null, true, true, Meter.type.MAMAC, null, gps,
			'MeterA', 'notes 1', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitA.id, unitA.id,
			Unit.areaUnitType.METERS, undefined);
		const meterB = new Meter(undefined, 'MeterB', null, true, true, Meter.type.MAMAC, null, gps,
			'MeterB', 'notes 2', 35.0, true, true, '01:01:25', '00:00:00', 5, 0, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitB.id, unitB.id,
			Unit.areaUnitType.METERS, undefined);
		const meterC = new Meter(undefined, 'Meter C', null, true, true, Meter.type.MAMAC, null);

		await Promise.all([meterA, meterB, meterC].map(meter => meter.insert(conn)));
		const expectedMeters = [meterA, meterB];
		const actualMeters = await Meter.getUnitNotNull(conn);
		actualMeters.sort((a, b) => a.id - b.id);
		expectedMeters.sort((a, b) => a.id - b.id);

		expect(expectedMeters.length).to.be.equal(actualMeters.length);
		for (let i = 0; i < expectedMeters.length; ++i) {
			expectMetersToBeEquivalent(expectedMeters[i], actualMeters[i]);
		}
	});
});
