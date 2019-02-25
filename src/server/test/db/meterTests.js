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
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC);
		await meterPreInsert.insert();
		const meterPostInsertByName = await Meter.getByName(meterPreInsert.name);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByName);
		const meterPostInsertByID = await Meter.getByID(meterPreInsert.id);
		expectMetersToBeEquivalent(meterPreInsert, meterPostInsertByID);
	});

	//TODO: not entirely sure what this is doing...
	mocha.it('can use the default connection in methods', () => new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert()
		.catch(() => chai.fail()));
});
