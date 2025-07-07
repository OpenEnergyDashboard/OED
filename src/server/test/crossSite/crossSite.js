/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the functionality of the DOMPurify library. It tests for XSS 
vulnerabilities in HTML of user uploaded data.*/

/* Run in OED Docker web container terminal/shell: 
 npm run testsome src/server/test/crossSite/crossSite.js */
const { chai, mocha, expect, app, testUser } = require('../common');

mocha.describe('Cross site', () => {
	mocha.it('test 1: tests for sanitization of HTML', async () => {
		const filePath = 'src/server/test/crossSite/readings.csv';

		const res = await chai.request(app).post('/api/csv/readings')
			.field('email', testUser.username)
			.field('password', testUser.password)
			/* This next line should produce: 
			res.text:  <h1>FAILURE</h1>CSVPipelineError: 
			User Error: Meter with name '<img src="x">' not found. */
			.field('meterName','<img src=x onerror="alert(document.domain)">')
			.field('gzip', "no")
			.attach('csvfile', 'src/server/test/crossSite/something.csv');
        expect(res.text).to.include('<img src="x">');
		expect(res).to.have.status(400); 
	});
});
