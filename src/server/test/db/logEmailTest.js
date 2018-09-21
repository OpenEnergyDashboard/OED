/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const LogEmail = require('../../models/LogEmail');

const mocha = require('mocha');


mocha.describe('Log Email', () => {
	mocha.beforeEach(recreateDB);
	mocha.beforeEach(async () => {
		await new LogEmail(undefined, 'Test error message').insert();
	});

	mocha.it('Get error message from database', async () => {
		let allEmails = await LogEmail.getAll();
		allEmails = allEmails.map(e => e.errorMessage);
		expect(allEmails[0]).to.equal('Test error message');
	});

	mocha.it('Delete all log email after sent, should fail because there are no items in table', async () => {
		await LogEmail.delete();
		expect(async () => {
			await LogEmail.getAll().to.throw(new Error('No path found'));
		});
	});
});
