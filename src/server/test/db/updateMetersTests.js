/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const testDB = require('./common').testDB;
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const updateAllMeters = require('../../services/updateMeters');
const mocha = require('mocha');
const sinon = require('sinon');


mocha.describe('Meter Update', () => {
	mocha.it('can persist over a failed request', async () => {
		const conn = testDB.getConnection();
		const goodMeter = new Meter(undefined, 'GOOD', 1, true, Meter.type.MAMAC);
		await goodMeter.insert(conn);

		const badMeter = new Meter(undefined, 'BAD', 2, true, Meter.type.MAMAC);
		await badMeter.insert(conn);

		const metersToUpdate = [goodMeter, badMeter];

		const dataReader = sinon.stub();
		dataReader.withArgs(goodMeter).resolves(new Reading(
			goodMeter.id,
			0,
			moment('1970-01-01 00:00:00'),
			moment('1970-01-01 01:00:00')
		));
		dataReader.withArgs(badMeter).rejects(new Error('Bland error message'));
		dataReader.throws();

		await updateAllMeters(dataReader, metersToUpdate, conn);
		const goodReadings = await Reading.getAllByMeterID(goodMeter.id, conn);
		const badReadings = await Reading.getAllByMeterID(badMeter.id, conn);

		expect(goodReadings.length).to.equal(1);
		expect(badReadings.length).to.equal(0);
	});
});

