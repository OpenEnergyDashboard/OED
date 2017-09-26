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

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');
const loadMamacReadingsFromCsvFile = require('../../services/loadMamacReadingsFromCsvFile');

const mocha = require('mocha');

mocha.describe('Insert Mamac readings from a file', () => {
	mocha.beforeEach(recreateDB);
	let meter;
	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
	});

	mocha.it('loads the correct number of rows from a file', async () => {
		const testFilePath = path.join(__dirname, 'data', 'test-readings.csv');
		const readingDuration = moment.duration(1, 'hours');
		await loadMamacReadingsFromCsvFile(testFilePath, meter, readingDuration);
		const { count } = await db.one('SELECT COUNT(*) as count FROM readings');
		expect(parseInt(count)).to.equal(20);
	});

	mocha.it('errors correctly on an invalid file', async () => {
		const testFilePath = path.join(__dirname, 'data', 'test-readings-invalid.csv');
		const readingDuration = moment.duration(1, 'hours');

		try {
			await loadMamacReadingsFromCsvFile(testFilePath, meter, readingDuration);
			expect.fail('should have thrown an exception');
		} catch (e) {
			// We want this to error
		}
	});
	mocha.it('rolls back correctly when it rejects', async () => {
		const testFilePath = path.join(__dirname, 'data', 'test-readings-invalid.csv');
		const readingDuration = moment.duration(1, 'hours');
		try {
			await loadMamacReadingsFromCsvFile(testFilePath, meter, readingDuration);
		} catch (e) {
			const { count } = await db.one('SELECT COUNT(*) as count FROM readings');
			expect(parseInt(count)).to.equal(0);
		}
	});
});
