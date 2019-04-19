/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const LogEmail = require('../../models/LogEmail');

mocha.describe('Log Email', () => {
	mocha.beforeEach(async () => {
		await new LogEmail(undefined, 'Test error message').insert(conn);
	});

	mocha.it('Get error message from database', async () => {
		conn = testDB.getConnection();
		let allEmails = await LogEmail.getAll(conn);
		allEmails = allEmails.map(e => e.errorMessage);
		expect(allEmails[0]).to.equal('Test error message');
	});

	mocha.it('Delete all log email after sent, should fail because there are no items in table', async () => {
		conn = testDB.getConnection();
		await LogEmail.delete(conn);
		expect(async () => {
			await LogEmail.getAll(conn).to.throw(new Error('No path found'));
		});
	});
});
