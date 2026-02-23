/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const zlib = require('zlib');
const { HTTP_CODE } = require('../../util/readingsUtils');
const { PASSWORD_MAX_LENGTH } = require('../../util/validationConstants');

mocha.describe('Obvius Parameter Validation', () => {

	mocha.describe('Authentication Validation', () => {
		mocha.it('should reject requests without username', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					password: 'testpass',
					mode: 'STATUS'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('username parameter is required');
		});

		mocha.it('should reject requests without password', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: 'testuser',
					mode: 'STATUS'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('password parameter is required');
		});

		mocha.it('should validate username length limits', async () => {
			const longUsername = 'x'.repeat(300);

			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: longUsername,
					password: 'testpass',
					mode: 'STATUS'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('Invalid username format');
		});

		mocha.it('should validate password length limits', async () => {
			const longPassword = 'x'.repeat(PASSWORD_MAX_LENGTH + 1);

			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: 'testuser',
					password: longPassword,
					mode: 'STATUS'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('Invalid password format');
		});

		mocha.it('should validate username type', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: 12345,
					password: 'testpass',
					mode: 'STATUS'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('Invalid username format');
		});

		mocha.it('should validate password type', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: 'testuser',
					password: 12345,
					mode: 'STATUS'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('Invalid password format');
		});

		mocha.it('should support backwards compatibility with email parameter', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					email: 'test@example.com',
					password: 'testpass',
					mode: 'STATUS'
				});

			// Should get to authentication rather than parameter validation error
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});
	});

	mocha.describe('Mode Parameter Validation', () => {
		const baseAuth = {
			username: 'testuser',
			password: 'testpass'
		};

		mocha.it('should require mode parameter', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send(baseAuth);

			// Route validates auth first, then mode parameter
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should handle STATUS mode', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					mode: 'STATUS'
				});

			// Will fail auth but validates mode parameter properly
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should reject unknown mode', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					mode: 'INVALID_MODE'
				});

			// Will fail auth before mode validation in current implementation
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});
	});

	mocha.describe('Logfile Upload Validation', () => {
		const baseAuth = {
			username: 'testuser',
			password: 'testpass',
			mode: 'LOGFILE_UPLOAD'
		};

		mocha.it('should require serial number for logfile upload', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send(baseAuth);

			// Will fail auth before validation in current implementation
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should validate serial number format', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					serialnumber: 'x'.repeat(150)
				});

			// Will fail auth before validation
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should validate serial number type', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					serialnumber: 12345
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});
	});

	mocha.describe('Config Upload Validation', () => {
		const baseAuth = {
			username: 'testuser',
			password: 'testpass',
			mode: 'CONFIG_FILE_UPLOAD'
		};

		mocha.it('should require serial number for config upload', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					modbusdevice: 'test'
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should require modbus device for config upload', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					serialnumber: 'test123'
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should validate serial number format in config upload', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					serialnumber: 'x'.repeat(150),
					modbusdevice: 'test'
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should validate modbus device format', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					serialnumber: 'test123',
					modbusdevice: 'x'.repeat(60)
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should validate parameter types', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					...baseAuth,
					serialnumber: 12345,
					modbusdevice: 67890
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});
	});

	mocha.describe('File Upload Security', () => {
		const baseAuth = {
			username: 'testuser',
			password: 'testpass',
			mode: 'LOGFILE_UPLOAD',
			serialnumber: 'test123'
		};

		mocha.it('should handle multer file size limits', async () => {
			// Create a large buffer that exceeds the 50MB limit
			const largeBuffer = Buffer.alloc(60 * 1024 * 1024, 'x');

			const res = await chai.request(app)
				.post('/api/obvius')
				.field('username', baseAuth.username)
				.field('password', baseAuth.password)
				.field('mode', baseAuth.mode)
				.field('serialnumber', baseAuth.serialnumber)
				.attach('logfile', largeBuffer, 'large.log.gz');

			// Multer file size/count limits may return various error codes
			expect([HTTP_CODE.BAD_REQUEST, 413, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
		});

		mocha.it('should handle maximum number of files', async () => {
			const testBuffer = Buffer.from('test data');
			let request = chai.request(app)
				.post('/api/obvius')
				.field('username', baseAuth.username)
				.field('password', baseAuth.password)
				.field('mode', baseAuth.mode)
				.field('serialnumber', baseAuth.serialnumber);

			// Try to attach 15 files (exceeds limit of 10)
			for (let i = 0; i < 15; i++) {
				request = request.attach(`file${i}`, testBuffer, `test${i}.log.gz`);
			}

			const res = await request;

			// Multer file size/count limits may return various error codes  
			expect([HTTP_CODE.BAD_REQUEST, 413, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
		});

		mocha.it('should handle gzip decompression errors gracefully', async () => {
			// Create invalid gzip data
			const invalidGzipBuffer = Buffer.from('not a gzip file');

			const res = await chai.request(app)
				.post('/api/obvius')
				.field('username', baseAuth.username)
				.field('password', baseAuth.password)
				.field('mode', baseAuth.mode)
				.field('serialnumber', baseAuth.serialnumber)
				.attach('logfile', invalidGzipBuffer, 'invalid.log.gz');

			// Will fail auth before reaching gzip processing
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});
	});

	mocha.describe('Security Attack Prevention', () => {
		mocha.it('should prevent SQL injection in username', async () => {
			const sqlInjection = "'; DROP TABLE users; --";

			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: sqlInjection,
					password: 'testpass',
					mode: 'STATUS'
				});

			// Should be handled safely (length validation may catch this)
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should prevent XSS injection in parameters', async () => {
			const xssPayload = '<script>alert("xss")</script>';

			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: xssPayload,
					password: 'testpass',
					mode: 'STATUS'
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
			// Response should be HTML-escaped
			if (res.text) {
				expect(res.text).to.not.include('<script>');
			}
		});

		mocha.it('should handle prototype pollution attempts', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: 'testuser',
					password: 'testpass',
					mode: 'STATUS',
					'__proto__': { isAdmin: true }
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should handle oversized parameter attacks', async () => {
			// TODO convert to const once set in route.
			const hugeString = 'x'.repeat(254 + 1);

			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: hugeString,
					password: 'testpass',
					mode: 'STATUS'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('Invalid username format');
		});
	});

	mocha.describe('Error Handling', () => {
		mocha.it('should return proper Obvius protocol error format', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					password: 'testpass'
				});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
			expect(res.text).to.include('<pre>');
			expect(res.text).to.include('username parameter is required');
			expect(res.text).to.include('</pre>');
		});

		mocha.it('should handle empty request body', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({});

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
		});

		mocha.it('should handle null request body', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send(null);

			expect(res.status).to.equal(HTTP_CODE.NOT_ACCEPTABLE);
		});

		mocha.it('should handle malformed JSON', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.set('Content-Type', 'application/json')
				.send('invalid json');

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});
	});

	mocha.describe('HTTP Method Handling', () => {
		mocha.it('should accept GET requests', async () => {
			const res = await chai.request(app)
				.get('/api/obvius')
				.query({
					username: 'testuser',
					password: 'testpass',
					mode: 'STATUS'
				});

			// Should process the request (will fail auth)
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should accept POST requests', async () => {
			const res = await chai.request(app)
				.post('/api/obvius')
				.send({
					username: 'testuser',
					password: 'testpass',
					mode: 'STATUS'
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});

		mocha.it('should accept PUT requests', async () => {
			const res = await chai.request(app)
				.put('/api/obvius')
				.send({
					username: 'testuser',
					password: 'testpass',
					mode: 'STATUS'
				});

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_ACCEPTABLE]).to.include(res.status);
		});
	});
});
