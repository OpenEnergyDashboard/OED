/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const md5 = require('md5');
const moment = require('moment');

const recreateDB = require('./common').recreateDB;
const Logfile = require("../../models/obvius/Logfile");

const mocha = require('mocha');

function expectLogfilesToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('filename', expected.filename);
	expect(actual).to.have.property('created');
	expect(actual.created.toISOString()).to.equal(expected.created.toISOString());
	expect(actual).to.have.property('hash', expected.hash);
	expect(actual).to.have.property('contents', expected.contents);
	expect(actual).to.have.property('processed', expected.processed);
}

mocha.describe('Logfiles', () => {
	mocha.beforeEach(recreateDB);
	mocha.it('can be saved and retrieved', async () => {
		const contents = "Some test contents for the log file.";
		const chash = md5(contents);
		const filename = "log.whatever.whenever";
		const logfilePreInsert = new Logfile(undefined, filename, moment(), chash, contents, false);
		await logfilePreInsert.insert();
		const logfilePostInsertByID = await Logfile.getByID(logfilePreInsert.id);
		expectLogfilesToBeEquivalent(logfilePreInsert, logfilePostInsertByID);
	});
});
