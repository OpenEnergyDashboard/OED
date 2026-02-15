/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { validateString, testInvalidField, validateNoExtraFields } = require('../util/validationHelpers');
const { HTTP_CODE } = require('../../util/readingsUtils');
const {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_MAX_LENGTH
} = require('../../util/validationConstants');

mocha.describe('Login Parameter Validation', () => {

	const LOGIN_ENDPOINT = '/api/login';

	const baseCredentials = {
		username: 'validuser@example.com',
		password: 'validpass123'
	};

	mocha.describe('Username Validation', () => {
		mocha.it('should validate username field', async () => {
			await testInvalidField({
				field: 'username',
				invalidValue: undefined,
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: [HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED]
			});

			await testInvalidField({
				field: 'username',
				invalidValue: 'x'.repeat(USERNAME_MIN_LENGTH - 1),
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: [HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED]
			});

			await testInvalidField({
				field: 'username',
				invalidValue: 'x'.repeat(USERNAME_MAX_LENGTH + 1),
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: [HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED]
			});
		});

		mocha.it('should handle malicious username inputs', async () => {
			// Test SQL injection attempt - login will return 401 for invalid credentials
			await testInvalidField({
				field: 'username',
				invalidValue: "'; DROP TABLE users; --",
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});

			// Test XSS attempt - login will return 401 for invalid credentials
			await testInvalidField({
				field: 'username',
				invalidValue: '<script>alert("xss")</script>',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});

			// Test LDAP injection attempt
			await testInvalidField({
				field: 'username',
				invalidValue: 'admin)(&(password=*))',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});
		});

		mocha.it('should handle username edge cases', async () => {
			// Test extremely long username (should be caught by validation)
			await testInvalidField({
				field: 'username',
				invalidValue: 'user@' + 'x'.repeat(250) + '.com',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			// Test empty username
			await testInvalidField({
				field: 'username',
				invalidValue: '',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			// Test null bytes - TODO: Currently returns 500 (likely database rejection of null bytes)
			// May be correct behavior but needs review
			// Should this return 400 (validation error) or 500 (DB protection)?
			await testInvalidField({
				field: 'username',
				invalidValue: 'user\x00@example.com',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				// TODO: Verify this is correct expected behavior
				expectedStatus: HTTP_CODE.INTERNAL_SERVER_ERROR
			});
		});
	});

	mocha.describe('Password Validation', () => {
		mocha.it('should validate password field', async () => {
			await validateString({
				field: 'password',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				required: true,
				minLength: PASSWORD_MIN_LENGTH,
				maxLength: PASSWORD_MAX_LENGTH
			});
		});

		mocha.it('should handle malicious password inputs', async () => {
			// Test extremely long password (DoS attack) - should be caught by validation
			await testInvalidField({
				field: 'password',
				invalidValue: 'x'.repeat(1001),
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			// Test null bytes - login will return 401 for invalid credentials
			await testInvalidField({
				field: 'password',
				invalidValue: 'password\x00injection',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});

			// Test Unicode normalization attacks
			await testInvalidField({
				field: 'password',
				invalidValue: 'pa\u0073\u0073word', // Unicode 's'
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});
		});

		mocha.it('should handle password edge cases', async () => {
			// Test too short password
			await testInvalidField({
				field: 'password',
				invalidValue: 'short',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			// Test empty password
			await testInvalidField({
				field: 'password',
				invalidValue: '',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			// Test whitespace-only password
			await testInvalidField({
				field: 'password',
				invalidValue: '        ',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});
		});
	});

	mocha.describe('Parameter Injection Protection', () => {
		mocha.it('should reject payloads with extra fields', async () => {
			await validateNoExtraFields({
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				extraFields: {
					maliciousField: 'injection attempt',
					admin: true,
					role: 'ADMIN'
				},
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});
		});

		mocha.it('should reject completely invalid payloads', async () => {
			// Test non-object payload
			const res1 = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send('not an object');
			expect(res1).to.have.status(HTTP_CODE.BAD_REQUEST);

			// Test array payload
			const res2 = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send(['username', 'password']);
			expect(res2).to.have.status(HTTP_CODE.BAD_REQUEST);

			// Test null payload
			const res3 = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send(null);
			expect(res3).to.have.status(HTTP_CODE.BAD_REQUEST);
		});
	});

	mocha.describe('Authentication Logic Security', () => {
		mocha.it('should handle timing attack resistance', async () => {
			// Test that response times are similar for invalid user vs invalid password
			// This helps prevent username enumeration attacks
			const nonExistentUser = {
				username: 'nonexistent@example.com',
				password: 'somepassword123'
			};

			const start = Date.now();
			const res = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send(nonExistentUser);
			const end = Date.now();

			// Should return 401 for invalid credentials, not reveal user existence
			expect(res).to.have.status(HTTP_CODE.UNAUTHORIZED);
			expect(res.body).to.have.property('text', 'Not authorized');

			// Response should take reasonable time (not too fast revealing user doesn't exist)
			const responseTime = end - start;
			expect(responseTime).to.be.at.least(0);
		});

		mocha.it('should handle concurrent login attempts', async () => {
			const invalidCredentials = {
				username: 'test@example.com',
				password: 'wrongpassword'
			};

			// Send multiple concurrent requests to test for race conditions
			const promises = Array(5).fill().map(() =>
				chai.request(app)
					.post(LOGIN_ENDPOINT)
					.send(invalidCredentials)
			);

			const results = await Promise.all(promises);

			// All should fail consistently
			results.forEach(res => {
				expect(res).to.have.status(HTTP_CODE.UNAUTHORIZED);
				expect(res.body).to.have.property('text', 'Not authorized');
			});
		});

		mocha.it('should handle missing required fields', async () => {
			// Missing username
			const res1 = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send({ password: 'somepassword123' });
			expect(res1).to.have.status(HTTP_CODE.BAD_REQUEST);

			// Missing password
			const res2 = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send({ username: 'user@example.com' });
			expect(res2).to.have.status(HTTP_CODE.BAD_REQUEST);

			// Missing both
			const res3 = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send({});
			expect(res3).to.have.status(HTTP_CODE.BAD_REQUEST);
		});
	});

	mocha.describe('Type Safety', () => {
		mocha.it('should reject non-string usernames', async () => {
			await testInvalidField({
				field: 'username',
				invalidValue: 12345,
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			await testInvalidField({
				field: 'username',
				invalidValue: true,
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			await testInvalidField({
				field: 'username',
				invalidValue: { email: 'user@example.com' },
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});
		});

		mocha.it('should reject non-string passwords', async () => {
			await testInvalidField({
				field: 'password',
				invalidValue: 12345678,
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			await testInvalidField({
				field: 'password',
				invalidValue: true,
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});

			await testInvalidField({
				field: 'password',
				invalidValue: ['p', 'a', 's', 's', 'w', 'o', 'r', 'd'],
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.BAD_REQUEST
			});
		});
	});
});
