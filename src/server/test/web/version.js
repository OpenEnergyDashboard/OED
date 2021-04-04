/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the trivial version API.
 * It may be used as a template for future tests. */

const { chai, mocha, expect, app } = require('../common');

const VERSION = require('../../version');

mocha.describe('version API', () => {
	mocha.it('returns the app version', async () => {
		const res = await chai.request(app).get('/api/version');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res).to.be.string;
	});
});
