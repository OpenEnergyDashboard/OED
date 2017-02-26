/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');

const mocha = require('mocha');

mocha.describe('Meters', () => {
	mocha.beforeEach(recreateDB);
	mocha.it('can be saved and retrieved', () => db.task(function* runTest(t) {
		const meterPreInsert = new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC);
		yield meterPreInsert.insert(t);
		const meterPostInsert = yield Meter.getByName(meterPreInsert.name, t);
		expect(meterPostInsert).to.have.property('name', meterPreInsert.name);
	}));

	mocha.it('can use the default connection in methods', () => new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert()
		.catch(() => chai.fail()));
});
