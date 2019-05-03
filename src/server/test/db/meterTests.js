/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This class tests if the expected properties are the actual results from meters.
 */

/**
 * Initial imports.
 */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const recreateDB = require('./common').recreateDB;
const Meter = require('../../models/Meter');
const mocha = require('mocha');
const { mocha, expect, testDB } = require('../common');
const Meter = require('../../models/Meter');
/**
 * Checks if the expected meter properties have the actual properties.
 * @param expected
 * @param actual
 */
function expectMetersToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('name', expected.name);
	expect(actual).to.have.property('enabled', expected.enabled);
	expect(actual).to.have.property('type', expected.type);
}

/**
 * Test for meters.
 */
mocha.describe('Meters', () => {
	/**
	 * Here is where the DB is recreated.
	 */
	mocha.beforeEach(recreateDB);
	/**
	 * Meter readings are created and then passed to expectMetersToBeEquivalent.
	 */
	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC);
		await meterPreInsert.insert(conn);
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	mocha.it('can use the default connection in methods', () => new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert()
		.catch(() => chai.fail()));

  mocha.it('can be saved, edited, and retrieved', async () => {
		const conn = testDB.getConnection();
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC);
		await meterPreInsert.insert(conn);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);

		meterPreInsert.name = 'Something Else';
		meterPreInsert.enabled = true;
		await meterPreInsert.update(conn);
		const meterPostUpdate = await Meter.getByID(meterPreInsert.id, conn);
		expectMetersToBeEquivalent(meterPreInsert, meterPostUpdate);
	});

	mocha.it('can get only enabled meters', async () => {
		const conn = testDB.getConnection();
		const enabledMeter = new Meter(undefined, 'EnabledMeter', null, true, true, Meter.type.MAMAC);
		const disabledMeter = new Meter(undefined, 'DisabledMeter', null, false, true, Meter.type.MAMAC);

		await enabledMeter.insert(conn);
		await disabledMeter.insert(conn);

		const enabledMeters = await Meter.getEnabled(conn);
		expect(enabledMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(enabledMeter, enabledMeters[0]);
	});

	mocha.it('can get only visible meters', async () => {
		const conn = testDB.getConnection();
		const visibleMeter = new Meter(undefined, 'VisibleMeter', null, true, true, Meter.type.MAMAC);
		const invisibleMeter = new Meter(undefined, 'InvisibleMeter', null, true, false, Meter.type.MAMAC);

		await visibleMeter.insert(conn);
		await invisibleMeter.insert(conn);

		const visibleMeters = await Meter.getDisplayable(conn);
		expect(visibleMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(visibleMeter, visibleMeters[0]);
	});
});
