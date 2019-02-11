/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');
const path = require('path');

chai.use(chaiAsPromised);
const expect = chai.expect;

const testDB = require('./common').testDB;
const Reading = require('../../models/Reading');
const Meter = require('../../models/Meter');
const loadMamacReadingsFromCsvFile = require('../../services/loadMamacReadingsFromCsvFile');

const mocha = require('mocha');

mocha.describe('Insert Mamac readings from a file', () => {
	let meter;
	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert(conn);
		meter = await Meter.getByName('Meter', conn);
	});

	mocha.it('loads the correct number of rows from a file', async () => {
		conn = testDB.getConnection();
		const testFilePath = path.join(__dirname, 'data', 'test-readings.csv');
		const readingDuration = moment.duration(1, 'hours');
		await loadMamacReadingsFromCsvFile(testFilePath, meter, readingDuration, conn);
		const count = await Reading.count(conn);
		expect(parseInt(count)).to.equal(20);
	});

	mocha.it('errors correctly on an invalid file', async () => {
		conn = testDB.getConnection();
		const testFilePath = path.join(__dirname, 'data', 'test-readings-invalid.csv');
		const readingDuration = moment.duration(1, 'hours');

		try {
			await loadMamacReadingsFromCsvFile(testFilePath, meter, readingDuration, conn);
			expect.fail('should have thrown an exception');
		} catch (e) {
			// We want this to error
			// TODO: I think Mocha actually has a way to do this with expect()
		}
	});
	mocha.it('rolls back correctly when it rejects', async () => {
		conn = testDB.getConnection();
		const testFilePath = path.join(__dirname, 'data', 'test-readings-invalid.csv');
		const readingDuration = moment.duration(1, 'hours');
		try {
			await loadMamacReadingsFromCsvFile(testFilePath, meter, readingDuration, conn);
		} catch (e) {
			const count = await Reading.count(conn);
			expect(parseInt(count)).to.equal(0);
		}
	});
});
