/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { HTTP_CODE } = require('../../util/readingsUtils');

mocha.describe('CIKs Parameter Validation', () => {

	mocha.describe('GET /api/ciks - Get All CIKs', () => {
		mocha.it('should accept GET requests without parameters', async () => {
			const res = await chai.request(app)
				.get('/api/ciks');

			expect(res).to.have.status(HTTP_CODE.OK);
		});

		mocha.it('should ignore query parameters if provided', async () => {
			const res = await chai.request(app)
				.get('/api/ciks')
				.query({ someParam: 'value', anotherParam: 123 });

			expect(res).to.have.status(HTTP_CODE.OK);
		});

		mocha.it('should return JSON response', async () => {
			const res = await chai.request(app)
				.get('/api/ciks');

			if (res.status === HTTP_CODE.OK) {
				expect(res).to.be.json;
				expect(res.body).to.be.an('array');
			}
		});

		mocha.it('should return properly formatted CIK objects', async () => {
			const res = await chai.request(app)
				.get('/api/ciks');

			if (res.status === HTTP_CODE.OK && res.body.length > 0) {
				const cik = res.body[0];
				expect(cik).to.have.property('meterUnitId');
				expect(cik).to.have.property('nonMeterUnitId');
				expect(cik).to.have.property('slope');
				expect(cik).to.have.property('intercept');
			}
		});
	});

	mocha.describe('Security Considerations', () => {
		mocha.it('should not be vulnerable to HTTP method override', async () => {
			const res = await chai.request(app)
				.get('/api/ciks')
				.set('X-HTTP-Method-Override', 'POST');

			expect(res).to.have.status(HTTP_CODE.OK);
		});

		mocha.it('should handle malformed headers gracefully', async () => {
			const res = await chai.request(app)
				.get('/api/ciks')
				.set('Content-Type', 'application/malformed')
				.set('Accept', 'text/invalid');

			expect(res).to.have.status(HTTP_CODE.OK);
		});
	});
});
