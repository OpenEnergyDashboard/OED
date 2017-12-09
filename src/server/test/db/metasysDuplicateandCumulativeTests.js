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
		await new Meter(undefined, 'metasys-duplicate', null, false, Meter.type.METASYS).insert();
	//	meter = await Meter.getByName('metasys-duplicate');
	});

	mocha.it('handles duplicate readings', async () => {
		const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
		await readMetasysData(testFilePath, 60, 2, false);
		const { count } = await db.one('SELECT COUNT(*) as count FROM readings');
		expect(parseInt(count)).to.equal(37);
	});

	mocha.it('handles cumulative readings', async () => {
		const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
		await readMetasysData(testFilePath, 60, 2, true);
		const { reading } = await db.one('SELECT reading FROM readings LIMIT 1');
		expect(parseInt(reading)).to.equal(280);
	});
});

