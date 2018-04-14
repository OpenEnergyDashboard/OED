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
const Logfile = require('../../models/obvius/Logfile');
const listLogfiles = require('../../services/obvius/listLogfiles');

const mocha = require('mocha');

function expectLogfilesToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('ipAddress', expected.ipAddress);
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
		const contents = 'Some test contents for the log file.';
		const chash = md5(contents);
		const filename = 'log.whatever.whenever';
		const ipAddress = '0.0.0.0';
		const logfilePreInsert = new Logfile(undefined, ipAddress, filename, moment(), chash, contents, false);
		await logfilePreInsert.insert();
		const logfilePostInsertByID = await Logfile.getByID(1);
		expectLogfilesToBeEquivalent(logfilePreInsert, logfilePostInsertByID);
	});
	mocha.it('can be retrieved by IP address', async () => {
		const logfile1 = new Logfile(undefined, "0.0.0.0", "logfile1", moment().subtract(1, 'd'), md5("contents"), "contents", true);
		const logfile2 = new Logfile(undefined, "0.0.0.0", "logfile2", moment(), md5("contents"), "contents", true);
		const logfile3 = new Logfile(undefined, "0.0.0.1", "logfile3", moment(), md5("contents"), "contents", true);
		await logfile1.insert();
		await logfile2.insert();
		await logfile3.insert();

		// Test correct length.
		const logfilesForAllZeroes = await Logfile.getByIP('0.0.0.0');
		expect(logfilesForAllZeroes).to.have.length(2);
		const logfilesForOneOne = await Logfile.getByIP('0.0.0.1');
		expect(logfilesForOneOne).to.have.length(1);

		// Test correct ordering.
		expectLogfilesToBeEquivalent(logfilesForAllZeroes[0], logfile1);
		expectLogfilesToBeEquivalent(logfilesForAllZeroes[1], logfile2);
	});
	mocha.it('can generate an Obvius config manifest', async () => {
		const logfile1 = new Logfile(undefined, "0.0.0.0", "logfile1", moment(), md5("contents1"), "contents1", true);
		const logfile2 = new Logfile(undefined, "0.0.0.0", "logfile2", moment(), md5("contents2"), "contents2", true);
		const logfile3 = new Logfile(undefined, "0.0.0.0", "logfile3", moment(), md5("contents3"), "contents3", true);

		await logfile1.insert();
		await logfile2.insert();
		await logfile3.insert();

		const expectation = 'CONFIGFILE,logfile1,4891e2a24026da4dea5b4119e1dc1863\nCONFIGFILE,logfile2,b2d0efbdc48f4b7bf42f8ab76d71f84e\nCONFIGFILE,logfile3,2635f317ed53a4fc4014650181fa7ccd\n';

		expect(await listLogfiles()).to.equal(expectation);
	})
});
