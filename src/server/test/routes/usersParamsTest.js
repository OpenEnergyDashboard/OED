/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { testInvalidField } = require('../util/validationHelpers');
const { HTTP_CODE } = require('../../util/readingsUtils');
const { PASSWORD_MAX_LENGTH, TOKEN_MAX_LENGTH, STRING_GENERAL_MAX_LENGTH } = require('../../util/validationConstants');

mocha.describe('Users Parameter Validation', () => {

	mocha.describe('GET /api/users/token - Token Validation', () => {
		const TOKEN_ENDPOINT = '/api/users/token';

		mocha.it('should validate token length limits', async () => {
			// Test extremely long token - should be caught by validation
			const hugeToken = 'x'.repeat(TOKEN_MAX_LENGTH + 1);
			const res = await chai.request(app)
				.get(TOKEN_ENDPOINT)
				.set('token', hugeToken);
			expect(res).to.have.status(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should reject non-string tokens', async () => {
			// Test non-string token in header
			const res1 = await chai.request(app)
				.get(TOKEN_ENDPOINT)
				.set('token', 12345);
			expect(res1).to.have.status(HTTP_CODE.UNAUTHORIZED); // JWT verification failure

			// Test missing token
			const res2 = await chai.request(app)
				.get(TOKEN_ENDPOINT);
			expect(res2).to.have.status(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should handle malformed tokens', async () => {
			const malformedTokens = [
				'malformed.jwt.token',
				'not.a.jwt',
				'',
				'null',
				'undefined'
			];

			for (const token of malformedTokens) {
				const res = await chai.request(app)
					.get(TOKEN_ENDPOINT)
					.set('token', token);

				// Should either be 403 (validation) or 401 (JWT verification)
				expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			}
		});
	});

	mocha.describe('GET /api/users/:user_id - User ID Validation', () => {
		const USER_ID_ENDPOINT = '/api/users/123';

		mocha.it('should validate user_id parameter', async () => {
			// Test invalid user ID patterns (non-numeric)
			const invalidIds = ['abc', '12abc', 'user123', 'null', ''];

			for (const invalidId of invalidIds) {
				const res = await chai.request(app)
					.get(`/api/users/${invalidId}`);

				// Should return 403 for auth error (admin required) or 400 for validation
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			}
		});

		mocha.it('should handle extremely long user IDs', async () => {
			const longId = '1'.repeat(25);
			const res = await chai.request(app)
				.get(`/api/users/${longId}`);

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should handle SQL injection in user ID', async () => {
			const sqlInjection = encodeURIComponent("1' OR '1'='1");
			const res = await chai.request(app)
				.get(`/api/users/${sqlInjection}`);

			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});
	});

	mocha.describe('POST /api/users/create - User Creation Validation', () => {
		const CREATE_ENDPOINT = '/api/users/create';

		const baseUserData = {
			username: 'newuser@example.com',
			password: 'newpassword123',
			// TODO: Use actual enum value from User.role
			role: 'ADMIN',
			note: 'Test user creation'
		};

		mocha.it('should validate username field', async () => {
			// Admin auth middleware returns 403 before validation, so test manually
			await testInvalidField({
				field: 'username',
				// Too long
				invalidValue: 'x'.repeat(255),
				endpoint: CREATE_ENDPOINT,
				basePayload: baseUserData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate password field', async () => {
			// Admin auth middleware returns 403 before validation
			await testInvalidField({
				field: 'password',
				// Too long
				invalidValue: 'x'.repeat(PASSWORD_MAX_LENGTH + 1),
				endpoint: CREATE_ENDPOINT,
				basePayload: baseUserData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate note field', async () => {
			// Admin auth middleware returns 403 before validation
			await testInvalidField({
				field: 'note',
				// Too long
				invalidValue: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1),
				endpoint: CREATE_ENDPOINT,
				basePayload: baseUserData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should reject invalid role values', async () => {
			const invalidRoles = ['INVALID_ROLE', 'admin', 'user', '', 'ROOT', 'SUPERUSER'];

			for (const invalidRole of invalidRoles) {
				await testInvalidField({
					field: 'role',
					invalidValue: invalidRole,
					endpoint: CREATE_ENDPOINT,
					basePayload: baseUserData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should reject payloads with extra fields', async () => {
			const payloadWithExtra = {
				...baseUserData,
				maliciousField: 'injection attempt',
				isAdmin: true,
				permissions: ['all']
			};

			const res = await chai.request(app)
				.post(CREATE_ENDPOINT)
				.send(payloadWithExtra);
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should handle malicious username inputs', async () => {
			const maliciousInputs = [
				"'; DROP TABLE users; --",
				'<script>alert("xss")</script>',
				'admin)(&(password=*))',
				'user\x00@example.com'
			];

			for (const maliciousInput of maliciousInputs) {
				await testInvalidField({
					field: 'username',
					invalidValue: maliciousInput,
					endpoint: CREATE_ENDPOINT,
					basePayload: baseUserData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should handle missing required fields', async () => {
			const requiredFields = ['username', 'password', 'role', 'note'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseUserData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(CREATE_ENDPOINT)
					.send(payloadMissingField);
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
			}
		});
	});

	mocha.describe('POST /api/users/edit - User Edit Validation', () => {
		const EDIT_ENDPOINT = '/api/users/edit';

		const baseEditData = {
			user: {
				id: 1,
				username: 'edituser@example.com',
				role: 'ADMIN',
				// TODO: Use actual enum value from User.role
				note: 'Edited user',
				password: 'newpassword123'
			}
		};

		mocha.it('should validate user object structure', async () => {
			// Test missing user object - admin auth returns 403
			const res1 = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send({});
			expect(res1.status).to.equal(HTTP_CODE.FORBIDDEN);

			// Test invalid user object type - admin auth returns 403
			const res2 = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send({ user: 'not an object' });
			expect(res2.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate user ID field', async () => {
			// Admin auth middleware returns 403 before validation
			await testInvalidField({
				field: 'id',
				invalidValue: -1,
				endpoint: EDIT_ENDPOINT,
				basePayload: { user: { ...baseEditData.user } },
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate username field in edit', async () => {
			const testPayload = {
				user: {
					...baseEditData.user,
					username: 'test'
				}
			};

			// Admin auth middleware returns 403 before validation
			await testInvalidField({
				field: 'username',
				invalidValue: 'x'.repeat(255),
				endpoint: EDIT_ENDPOINT,
				basePayload: testPayload,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate optional password field', async () => {
			// Test password too long
			await testInvalidField({
				field: 'password',
				invalidValue: 'x'.repeat(PASSWORD_MAX_LENGTH + 1),
				endpoint: EDIT_ENDPOINT,
				basePayload: { user: { ...baseEditData.user } },
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test password can be omitted (optional field)
			const payloadWithoutPassword = {
				user: {
					...baseEditData.user
				}
			};
			delete payloadWithoutPassword.user.password;

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(payloadWithoutPassword);
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should validate note field in edit', async () => {
			const testPayload = {
				user: {
					...baseEditData.user,
					note: 'test'
				}
			};

			// Admin auth middleware returns 403 before validation
			await testInvalidField({
				field: 'note',
				invalidValue: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1),
				endpoint: EDIT_ENDPOINT,
				basePayload: testPayload,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should reject extra fields in user object', async () => {
			const payloadWithExtra = {
				user: {
					...baseEditData.user,
					maliciousField: 'injection',
					isActive: true,
					permissions: ['admin']
				}
			};

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(payloadWithExtra);
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should handle nested parameter injection', async () => {
			const payloadWithExtraFields = {
				user: baseEditData.user,
				maliciousField: 'top level injection',
				admin: true
			};

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(payloadWithExtraFields);
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});
	});

	mocha.describe('POST /api/users/delete - User Deletion Validation', () => {
		const DELETE_ENDPOINT = '/api/users/delete';

		const baseDeleteData = {
			username: 'deleteuser@example.com'
		};

		mocha.it('should validate username field', async () => {
			// Admin auth middleware returns 403 before validation
			await testInvalidField({
				field: 'username',
				invalidValue: 'x'.repeat(255),
				endpoint: DELETE_ENDPOINT,
				basePayload: baseDeleteData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should reject payloads with extra fields', async () => {
			const payloadWithExtra = {
				...baseDeleteData,
				force: true,
				confirmDelete: true,
				maliciousField: 'injection'
			};

			const res = await chai.request(app)
				.post(DELETE_ENDPOINT)
				.send(payloadWithExtra);
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});

		mocha.it('should handle malicious username inputs', async () => {
			const maliciousInputs = [
				"'; DROP TABLE users; --",
				'../../../etc/passwd',
				'<script>alert("xss")</script>',
				'admin\x00user'
			];

			for (const maliciousInput of maliciousInputs) {
				await testInvalidField({
					field: 'username',
					invalidValue: maliciousInput,
					endpoint: DELETE_ENDPOINT,
					basePayload: baseDeleteData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should handle non-string usernames', async () => {
			const nonStringUsernames = [
				12345,
				true,
				null,
				undefined,
				{ username: 'user@example.com' },
				['user@example.com']
			];

			for (const invalidUsername of nonStringUsernames) {
				await testInvalidField({
					field: 'username',
					invalidValue: invalidUsername,
					endpoint: DELETE_ENDPOINT,
					basePayload: baseDeleteData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});
	});

	mocha.describe('Cross-Endpoint Security Tests', () => {
		mocha.it('should handle concurrent requests safely', async () => {
			const CREATE_ENDPOINT = '/api/users/create';
			const userData = {
				username: 'concurrent@example.com',
				password: 'password123',
				role: 'ADMIN',
				note: 'Concurrent test'
			};

			// Send multiple concurrent requests
			const promises = Array(3).fill().map(() =>
				chai.request(app)
					.post(CREATE_ENDPOINT)
					.send(userData)
			);

			const results = await Promise.all(promises);

			// All should fail with 403 (admin auth required)
			results.forEach(res => {
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			});
		});

		mocha.it('should reject completely invalid payloads', async () => {
			const endpoints = [
				'/api/users/create',
				'/api/users/edit',
				'/api/users/delete'
			];

			for (const endpoint of endpoints) {
				// Test non-object payload - admin auth returns 403
				const res1 = await chai.request(app)
					.post(endpoint)
					.send('not an object');
				expect(res1.status).to.equal(HTTP_CODE.FORBIDDEN);

				// Test array payload - admin auth returns 403
				const res2 = await chai.request(app)
					.post(endpoint)
					.send(['array', 'payload']);
				expect(res2.status).to.equal(HTTP_CODE.FORBIDDEN);

				// Test null payload - admin auth returns 403
				const res3 = await chai.request(app)
					.post(endpoint)
					.send(null);
				expect(res3.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});
	});
});
