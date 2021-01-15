/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect, testDB } = require('../common');
const path = require('path');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const insertMetasysData = require('../../services/pipeline-in-progress/insertMetasysData');

mocha.describe('PIPELINE: insert MetasysData from csv file', () => {
	mocha.describe('with metasys-duplicate meter', () => {
		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			await new Meter(undefined, 'metasys-duplicate', null, false, true, Meter.type.METASYS).insert(conn);
		});

		mocha.it('handles duplicate readings', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
			await insertMetasysData(testFilePath, 60, 2, false, false, conn);
			const count = await Reading.count(conn);
			expect(count).to.equal(37);
		});

		mocha.it('handles cumulative readings', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
			await insertMetasysData(testFilePath, 60, 2, true, true, conn);
			const { reading } = await conn.one('SELECT reading FROM readings LIMIT 1');
			expect(parseInt(reading)).to.equal(280);
		});
	});
	mocha.describe('with metasys-invalid meter', () => {
		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			await new Meter(undefined, 'metasys-invalid', null, false, true, Meter.type.METASYS).insert(conn);
		});

		mocha.it('errors correctly on an invalid file', () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-invalid.csv');
			return expect(insertMetasysData(testFilePath, 30, 1, false, false, conn)).to.eventually.be.rejected;
		});

		mocha.it('rolls back correctly when it rejects', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-invalid.csv');
			try {
				await insertMetasysData(testFilePath, 30, 1, false, false, conn);
			} catch (e) {
				const count = await Reading.count(conn);
				expect(count).to.equal(0);
			}
		});
	});

	mocha.describe('with metasys-valid meter', () => {
		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			await new Meter(undefined, 'metasys-valid', null, false, true, Meter.type.METASYS).insert(conn);
		});

		mocha.it('loads the correct number of rows from a file (drop last row)', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-valid.csv');
			await insertMetasysData(testFilePath, 30, 1, true, true, conn);
			const count = await Reading.count(conn);
			expect(count).to.equal(124);
		});
	});
});
