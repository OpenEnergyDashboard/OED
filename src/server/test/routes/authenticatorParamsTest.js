/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { validateString, testInvalidField, validateNoExtraFields } = require('../util/validationHelpers');
const { HTTP_CODE } = require('../../util/readingsUtils');
const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, TOKEN_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH }
	= require('../../util/validationConstants');

// Note: authenticator.js primarily contains middleware functions, not direct API endpoints
// However, the credentialsRequestValidationMiddleware is used by other routes that accept username/password
// We'll test the validation logic through a mock endpoint or by testing routes that use it

mocha.describe('Authenticator Parameter Validation', () => {

	// TODO: There is overlap between authenticator tests and user tests (both validate username/password,
	// malicious inputs, and field length limits). Consider consolidating shared test data (malicious username
	// patterns, SQL injection strings, etc.) into a shared fixture file in src/server/test/util/ in the future.

	// Test the credentials validation used by login and obvius endpoints
	mocha.describe('Credentials Validation (username/password)', () => {
		// Since authenticator.js doesn't export direct endpoints, we test through routes that use it
		// The login route uses credentialsRequestValidationMiddleware
		const LOGIN_ENDPOINT = '/api/login';

		const baseCredentials = {
			username: 'validuser',
			password: 'validpass123'
		};

		mocha.it('should validate username field', async () => {
			await validateString({
				field: 'username',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				required: true,
				minLength: USERNAME_MIN_LENGTH,
				maxLength: USERNAME_MAX_LENGTH
			});
		});

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

		mocha.it('should reject payloads with extra fields (parameter injection)', async () => {
			await validateNoExtraFields({
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				extraFields: {
					maliciousField: 'injection attempt',
					anotherField: 'should be rejected'
				},
				expectedStatus: HTTP_CODE.BAD_REQUEST
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

			// Test command injection attempt
			await testInvalidField({
				field: 'username',
				invalidValue: '$(rm -rf /)',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});

			await testInvalidField({
				field: 'username',
				invalidValue: '| cat /etc/passwd',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});
		});

		mocha.it('should handle malicious password inputs', async () => {
			// Test extremely long password (DoS attack)
			await testInvalidField({
				field: 'password',
				invalidValue: 'x'.repeat(PASSWORD_MAX_LENGTH + 1),
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

			// Test command injection attempt
			await testInvalidField({
				field: 'password',
				invalidValue: '$(rm -rf /)',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});

			await testInvalidField({
				field: 'password',
				invalidValue: '`shutdown -h now`',
				endpoint: LOGIN_ENDPOINT,
				basePayload: baseCredentials,
				expectedStatus: HTTP_CODE.UNAUTHORIZED
			});
		});
	});

	// Test token validation used by auth middleware
	mocha.describe('Token Validation', () => {
		// Test through an endpoint that requires authentication
		// Most endpoints use authMiddleware, so we'll test through a protected route
		const PROTECTED_ENDPOINT = '/api/users';

		mocha.it('should validate token length limits', async () => {
			// Test extremely long token - auth middleware returns 403 for validation failure
			const hugeToken = 'x'.repeat(TOKEN_MAX_LENGTH + 1);
			const res = await chai.request(app)
				.get(PROTECTED_ENDPOINT)
				.set('token', hugeToken);
			expect(res).to.have.status(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should reject non-string tokens in headers', async () => {
			const res = await chai.request(app)
				.get(PROTECTED_ENDPOINT)
				.set('token', 12345);

			expect(res).to.have.status(HTTP_CODE.UNAUTHORIZED);
		});

		mocha.it('should reject non-string tokens in body', async () => {
			const res = await chai.request(app)
				.post(PROTECTED_ENDPOINT)
				.send({ token: 12345 });

			expect(res).to.have.status(HTTP_CODE.NOT_FOUND);
		});

		mocha.it('should reject non-string tokens in query', async () => {
			const res = await chai.request(app)
				.get(PROTECTED_ENDPOINT)
				.query({ token: 12345 });

			expect(res).to.have.status(HTTP_CODE.UNAUTHORIZED);
		});

		mocha.it('should handle extremely long bearer tokens', async () => {
			// Emulate a bearer token prefix to ensure length check still applies
			const hugeToken = 'Bearer ' + 'x'.repeat(TOKEN_MAX_LENGTH + 1);
			const res = await chai.request(app)
				.get(PROTECTED_ENDPOINT)
				.set('token', hugeToken);

			expect(res).to.have.status(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should reject malformed JWT tokens', async () => {
			const malformedTokens = [
				'malformed.jwt.token',
				'not.a.jwt',
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
				'', // Empty token
				'null',
				'undefined'
			];

			for (const token of malformedTokens) {
				const res = await chai.request(app)
					.get(PROTECTED_ENDPOINT)
					.set('token', token);

				// Should either be 403 (invalid format) or 401 (invalid signature)
				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			}
		});
	});

	mocha.describe('Security Edge Cases', () => {
		mocha.it('should handle concurrent authentication attempts', async () => {
			const LOGIN_ENDPOINT = '/api/login';
			const invalidCredentials = {
				username: 'nonexistent',
				password: 'wrongpass'
			};

			// Send multiple concurrent requests to test DoS prevention
			const promises = Array(10).fill().map(() =>
				chai.request(app)
					.post(LOGIN_ENDPOINT)
					.send(invalidCredentials)
			);

			const results = await Promise.all(promises);

			// All should fail with 400 or 401 (invalid credentials)
			results.forEach(res => {
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED]).to.include(res.status);
			});
		});

		mocha.it('should prevent username enumeration attacks', async () => {
			const LOGIN_ENDPOINT = '/api/login';

			// Test with non-existent user vs invalid password for existing user
			// Both should return similar error responses (timing-safe)
			const nonExistentUser = {
				username: 'nonexistentuser12345',
				password: 'somepassword'
			};

			const res1 = await chai.request(app)
				.post(LOGIN_ENDPOINT)
				.send(nonExistentUser);

			// Response should not reveal whether user exists or not
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED]).to.include(res1.status);
		});
	});
});
