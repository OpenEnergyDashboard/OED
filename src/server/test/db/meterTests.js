/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const Meter = require('../../models/Meter');
const Point = require('../../models/Point');
const gps = new Point(90, 45);

function expectMetersToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('name', expected.name);
	expect(actual).to.have.property('enabled', expected.enabled);
	expect(actual).to.have.property('type', expected.type);
	expect(actual).to.have.property('gps');
	expect(actual.gps).to.have.property('latitude', expected.gps.latitude);
	expect(actual.gps).to.have.property('longitude', expected.gps.longitude);
	expect(actual).to.have.property('identifier', expected.identifier);
	expect(actual).to.have.property('note', expected.note);
	expect(actual).to.have.property('area', expected.area);
	expect(actual).to.have.property('cumulative', expected.cumulative);
	expect(actual).to.have.property('cumulativeReset', expected.cumulativeReset);
	expect(actual).to.have.property('cumulativeResetStart', expected.cumulativeResetStart);
	expect(actual).to.have.property('cumulativeResetEnd', expected.cumulativeResetEnd);
	expect(actual).to.have.property('previousDay', expected.previousDay);
	expect(actual).to.have.property('readingLength', expected.readingLength);
	expect(actual).to.have.property('readingVariation', expected.readingVariation);
}

mocha.describe('Meters', () => {
	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC',
		 gps,'IDENTIFIED', 'notess', 33.5, true, true, '05:05:09', '09:00:01', true, '00:00:00', 
		 '00:00:00', 25.5, '0011-05-022 : 23:59:59', '2020-07-02 : 01:00:10' );
		await meterPreInsert.insert(conn);
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	mocha.it('can be saved, edited, and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, 'UTC', gps,
			'Identified 1' ,'Notes', 35.0, true, true, '01:01:25' , '00:00:00', true, '05:00:00','00:00:00', 1.5,
			'0011-05-22 : 23:59:59', '2020-07-02 : 01:00:10');
		await meterPreInsert.insert(conn);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);

		meterPreInsert.name = 'Something Else';
		meterPreInsert.enabled = true;
		meterPreInsert.meterTimezone = 'GMT';
		await meterPreInsert.update(conn);
		const meterPostUpdate = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostUpdate);
	});

	mocha.it('can get only enabled meters', async () => {
		const conn = testDB.getConnection();
		const enabledMeter = new Meter(undefined, 'EnabledMeter', null, true, true, Meter.type.MAMAC, null, gps, 
		'Identified 2', 'Notes', 35.0, true, true, '01:01:25' , '00:00:00', true, '05:00:00','00:00:00', 1.5, 
		'0011-05-022 : 23:59:59', '2020-07-02 : 01:00:10');
		const disabledMeter = new Meter(undefined, 'DisabledMeter', null, false, true, Meter.type.MAMAC, null, gps,
		 'Identified 3' ,'Notes', 35.0, true, true, '01:01:25' , '00:00:00', true, '05:00:00','00:00:00', 1.5, 
		 '0011-05-022 : 23:59:59', '2020-07-02 : 01:00:10');
		await enabledMeter.insert(conn);
		await disabledMeter.insert(conn);

		const enabledMeters = await Meter.getEnabled(conn);
		expect(enabledMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(enabledMeter, enabledMeters[0]);
	});

	mocha.it('can get only visible meters', async () => {
		const conn = testDB.getConnection();
		const visibleMeter = new Meter(undefined, 'VisibleMeter', null, true, true, Meter.type.MAMAC, null, gps, 
		'Identified 4' ,'Notes', 35.0, true, true, '01:01:25' , '00:00:00', true, '05:00:00','00:00:00', 1.5, 
		'0011-05-022 : 23:59:59', '2020-07-02 : 01:00:10');
		const invisibleMeter = new Meter(undefined, 'InvisibleMeter', null, true, false, Meter.type.MAMAC, null, gps, 
		'Identified 5' ,'Notes', 35.0, true, true, '01:01:25' , '00:00:00', true, '05:00:00','00:00:00', 1.5, 
		'0011-05-022 : 23:59:59', '2020-07-02 : 01:00:10');

		await visibleMeter.insert(conn);
		await invisibleMeter.insert(conn);

		const visibleMeters = await Meter.getDisplayable(conn);
		expect(visibleMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(visibleMeter, visibleMeters[0]);
	});
});
