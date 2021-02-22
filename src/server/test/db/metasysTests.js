/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect, testDB } = require('../common');
const path = require('path');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const readMetasysData = require('../../services/readMetasysData');

mocha.describe('Metasys readings', () => {
	mocha.describe('with metasys-duplicate meter', () => {
		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			await new Meter(undefined, 'metasys-duplicate', null, false, true, Meter.type.METASYS, null).insert(conn);
		});

		mocha.it('handles duplicate readings', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
			await readMetasysData(testFilePath, 60, 2, false, conn);
			const count = await Reading.count(conn);
			expect(count).to.equal(37);
		});

		mocha.it('handles cumulative readings', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
			await readMetasysData(testFilePath, 60, 2, true, conn);
			const { reading } = await conn.one('SELECT reading FROM readings LIMIT 1');
			expect(parseInt(reading)).to.equal(280);
		});
	});
	mocha.describe('with metasys-invalid meter', () => {
		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			await new Meter(undefined, 'metasys-invalid', null, false, true, Meter.type.METASYS, null).insert(conn);
		});

		mocha.it('errors correctly on an invalid file', () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-invalid.csv');
			return expect(readMetasysData(testFilePath, 30, 1, false, conn)).to.eventually.be.rejected;
		});

		mocha.it('rolls back correctly when it rejects', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-invalid.csv');
			try {
				await readMetasysData(testFilePath, 30, 1, false, conn);
			} catch (e) {
				const count = await Reading.count(conn);
				expect(count).to.equal(0);
			}
		});
	});

	mocha.describe('with metasys-valid meter', () => {
		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			await new Meter(undefined, 'metasys-valid', null, false, true, Meter.type.METASYS, null).insert(conn);
		});

		mocha.it('loads the correct number of rows from a file', async () => {
			conn = testDB.getConnection();
			const testFilePath = path.join(__dirname, 'data', 'metasys-valid.csv');
			await readMetasysData(testFilePath, 30, 1, true, conn);
			const count = await Reading.count(conn);
			expect(count).to.equal(125);
		});
	});
});
