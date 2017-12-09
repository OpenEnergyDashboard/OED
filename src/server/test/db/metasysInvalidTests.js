/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');
const readMetasysData = require('../../services/readMetasysData');

const mocha = require('mocha');

mocha.describe('Insert Metasys readings from a file', () => {
	mocha.beforeEach(recreateDB);
	mocha.beforeEach(async () => {
		await new Meter(undefined, 'metasys-invalid', null, false, Meter.type.METASYS).insert();
	});

	mocha.it('errors correctly on an invalid file', () => {
		const testFilePath = path.join(__dirname, 'data', 'metasys-invalid.csv');
		return expect(readMetasysData(testFilePath, 30, 1, false)).to.eventually.be.rejected;
	});

	mocha.it('rolls back correctly when it rejects', async () => {
		const testFilePath = path.join(__dirname, 'data', 'metasys-invalid.csv');
		try {
			await readMetasysData(testFilePath, 30, 1, false);
		} catch (e) {
			const { count } = await db.one('SELECT COUNT(*) as count FROM readings');
			expect(parseInt(count)).to.equal(0);
		}
	});
});
