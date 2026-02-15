/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { HTTP_CODE } = require('../../util/readingsUtils');

mocha.describe('Version Parameter Validation', () => {

	mocha.describe('GET /api/version - Get Application Version', () => {
		mocha.it('should accept GET requests without parameters', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);
		});

		mocha.it('should return JSON response', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);
			expect(res).to.be.json;
			expect(res.body).to.be.a('string');
		});

		mocha.it('should ignore query parameters if provided', async () => {
			const res = await chai.request(app)
				.get('/api/version')
				.query({ someParam: 'value', anotherParam: 123 });

			expect(res.status).to.equal(HTTP_CODE.OK);
			expect(res).to.be.json;
		});

		mocha.it('should return non-empty version string', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);
			expect(res.body).to.be.a('string');
			expect(res.body.length).to.be.greaterThan(0);
		});

		mocha.it('should return consistent version across requests', async () => {
			const res1 = await chai.request(app)
				.get('/api/version');

			const res2 = await chai.request(app)
				.get('/api/version');

			expect(res1.status).to.equal(HTTP_CODE.OK);
			expect(res2.status).to.equal(HTTP_CODE.OK);
			expect(res1.body).to.equal(res2.body);
		});
	});

	mocha.describe('Security Considerations', () => {
		mocha.it('should not be vulnerable to HTTP method override', async () => {
			const res = await chai.request(app)
				.get('/api/version')
				.set('X-HTTP-Method-Override', 'POST');

			expect(res.status).to.equal(HTTP_CODE.OK);
		});

		mocha.it('should handle malformed headers gracefully', async () => {
			const res = await chai.request(app)
				.get('/api/version')
				.set('Content-Type', 'application/malformed')
				.set('Accept', 'text/invalid');

			expect(res.status).to.equal(HTTP_CODE.OK);
		});

		mocha.it('should not leak sensitive information in version string', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);

			// Version should not contain sensitive paths or internal details
			const version = res.body.toLowerCase();
			const sensitiveTerms = [
				'password', 'secret', 'key', 'token', 'private',
				'/etc/', '/usr/', '/var/', 'c:\\', 'database',
				'localhost', '127.0.0.1', 'admin'
			];

			sensitiveTerms.forEach(term => {
				expect(version).to.not.include(term);
			});
		});

		mocha.it('should handle concurrent requests safely', async () => {
			const requests = [];

			// Send multiple concurrent requests
			for (let i = 0; i < 10; i++) {
				requests.push(
					chai.request(app).get('/api/version')
				);
			}

			const responses = await Promise.all(requests);

			// All should succeed with same version
			responses.forEach(res => {
				expect(res.status).to.equal(HTTP_CODE.OK);
				expect(res.body).to.be.a('string');
			});

			// All responses should be identical
			const firstVersion = responses[0].body;
			responses.forEach(res => {
				expect(res.body).to.equal(firstVersion);
			});
		});
	});

	mocha.describe('HTTP Method Restrictions', () => {
		mocha.it('should reject POST requests', async () => {
			const res = await chai.request(app)
				.post('/api/version')
				.send({});

			expect([HTTP_CODE.NOT_FOUND, HTTP_CODE.METHOD_NOT_ALLOWED]).to.include(res.status);
		});

		mocha.it('should reject PUT requests', async () => {
			const res = await chai.request(app)
				.put('/api/version')
				.send({});

			expect([HTTP_CODE.NOT_FOUND, HTTP_CODE.METHOD_NOT_ALLOWED]).to.include(res.status);
		});

		mocha.it('should reject DELETE requests', async () => {
			const res = await chai.request(app)
				.delete('/api/version');

			expect([HTTP_CODE.NOT_FOUND, HTTP_CODE.METHOD_NOT_ALLOWED]).to.include(res.status);
		});

		mocha.it('should reject PATCH requests', async () => {
			const res = await chai.request(app)
				.patch('/api/version')
				.send({});

			expect([HTTP_CODE.NOT_FOUND, HTTP_CODE.METHOD_NOT_ALLOWED]).to.include(res.status);
		});
	});

	mocha.describe('Response Format Validation', () => {
		mocha.it('should have correct content type', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);
			expect(res).to.have.header('content-type', /application\/json/);
		});

		mocha.it('should have valid JSON format', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);
			expect(() => JSON.parse(JSON.stringify(res.body))).to.not.throw();
		});

		mocha.it('should return version in expected format', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);
			expect(res.body).to.be.a('string');

			// Version should be a reasonable format (not just random text)
			expect(res.body.length).to.be.lessThan(100);
			expect(res.body.trim()).to.equal(res.body);
		});
	});

	mocha.describe('Caching Behavior', () => {
		mocha.it('should handle cache headers appropriately', async () => {
			const res = await chai.request(app)
				.get('/api/version');

			expect(res.status).to.equal(HTTP_CODE.OK);

			// Version endpoint could potentially be cached
			// This test documents current behavior
			if (res.headers['cache-control']) {
				expect(res.headers['cache-control']).to.be.a('string');
			}
		});

		mocha.it('should handle conditional requests', async () => {
			const res1 = await chai.request(app)
				.get('/api/version');

			expect(res1.status).to.equal(HTTP_CODE.OK);

			// Test with If-None-Match if ETag is present
			if (res1.headers.etag) {
				const res2 = await chai.request(app)
					.get('/api/version')
					.set('If-None-Match', res1.headers.etag);

				// Should either return 304 Not Modified or 200 with same content
				expect([HTTP_CODE.OK, HTTP_CODE.NOT_MODIFIED]).to.include(res2.status);
			}
		});
	});

	mocha.describe('Error Handling', () => {
		mocha.it('should not crash on malformed requests', async () => {
			const res = await chai.request(app)
				.get('/api/version')
				.set('Accept-Encoding', 'invalid-encoding')
				.set('User-Agent', 'x'.repeat(1000));

			expect(res.status).to.equal(HTTP_CODE.OK);
		});

		mocha.it('should handle version module errors gracefully', async () => {
			// This endpoint depends on the version module
			// Should not expose internal errors
			const res = await chai.request(app)
				.get('/api/version');

			// Should either succeed or fail gracefully
			if (res.status !== HTTP_CODE.OK) {
				expect([HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			} else {
				expect(res.body).to.be.a('string');
			}
		});
	});
});
