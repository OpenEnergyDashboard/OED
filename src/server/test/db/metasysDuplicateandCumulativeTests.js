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
const readMetasysData = require('../../services/readMetasysData');

const mocha = require('mocha');
	mocha.describe('Insert Metasys readings from a file', () => {
		mocha.beforeEach(recreateDB);
		let meter;
		mocha.beforeEach(() => db.task(function* setupTests(t) {
			yield new Meter(undefined, 'metasys-duplicate', null, false, Meter.type.METASYS).insert(t);
			meter = yield Meter.getByName('metasys-duplicate', t);
		}));

		mocha.it('handles duplicate readings', () => {
			const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
			return readMetasysData(testFilePath, 60, 2, false)
			//what is this doing?
				.then(() => db.one('SELECT COUNT(*) as count FROM readings'))
				.then(({count}) => expect(parseInt(count)).to.equal(37));
		});
	});


	//reads the cumulativeReading properly
	//reads the gap properly


