/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const Meter = require('../../models/Meter');

const mocha = require('mocha');

function expectMetersToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('name', expected.name);
	expect(actual).to.have.property('enabled', expected.enabled);
	expect(actual).to.have.property('type', expected.type);
}

mocha.describe('Meters', () => {
	mocha.beforeEach(recreateDB);
	mocha.it('can be saved and retrieved', async () => {
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC);
		await meterPreInsert.insert();
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	mocha.it('can get only enabled meters', async () => {
		const enabledMeter = new Meter(undefined, 'EnabledMeter', null, true, true, Meter.type.MAMAC);
		const disabledMeter = new Meter(undefined, 'DisabledMeter', null, false, true, Meter.type.MAMAC);

		await enabledMeter.insert();
		await disabledMeter.insert();

		const enabledMeters = await Meter.getEnabled();
		expect(enabledMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(enabledMeter, enabledMeters[0]);
	});

	mocha.it('can get only visible meters', async () => {
		const visibleMeter = new Meter(undefined, 'VisibleMeter', null, true, true, Meter.type.MAMAC);
		const invisibleMeter = new Meter(undefined, 'InvisibleMeter', null, true, false, Meter.type.MAMAC);

		await visibleMeter.insert();
		await invisibleMeter.insert();

		const visibleMeters = await Meter.getDisplayable();
		expect(visibleMeters).to.have.lengthOf(1);
		expectMetersToBeEquivalent(visibleMeter, visibleMeters[0]);
	});

	mocha.it('can use the default connection in methods', () => new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC).insert()
		.catch(() => chai.fail()));
});
