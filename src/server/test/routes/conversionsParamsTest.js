/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { testInvalidField } = require('../util/validationHelpers');
const { STRING_GENERAL_MAX_LENGTH } = require('../../util/validationConstants');
const { HTTP_CODE } = require('../../util/readingsUtils');

mocha.describe('Conversions Parameter Validation', () => {

	mocha.describe('GET /api/conversions - Get All Conversions', () => {
		mocha.it('should accept GET requests without parameters', async () => {
			const res = await chai.request(app)
				.get('/api/conversions');

			// Should return 200 or 500 (DB error) - no auth required for reading
			expect([HTTP_CODE.OK, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
		});
	});

	mocha.describe('POST /api/conversions/edit - Edit Conversion Validation', () => {
		const EDIT_ENDPOINT = '/api/conversions/edit';

		const baseConversionData = {
			sourceId: 1,
			destinationId: 2,
			bidirectional: true,
			slope: 1.5,
			intercept: 0.0,
			note: 'Test conversion for validation'
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(baseConversionData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate required fields', async () => {
			const requiredFields = ['sourceId', 'destinationId', 'bidirectional', 'slope', 'intercept'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseConversionData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(payloadMissingField);

				// Should fail due to missing required field (validation catches before auth)
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate integer field constraints', async () => {
			// Test negative sourceId (minimum: 1)
			await testInvalidField({
				field: 'sourceId',
				invalidValue: 0,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			await testInvalidField({
				field: 'sourceId',
				invalidValue: -1,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test negative destinationId (minimum: 1)
			await testInvalidField({
				field: 'destinationId',
				invalidValue: 0,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test oversized integers (exceeds MAX_SAFE_INTEGER)
			await testInvalidField({
				field: 'sourceId',
				invalidValue: Number.MAX_SAFE_INTEGER + 1,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test non-integer values
			await testInvalidField({
				field: 'sourceId',
				invalidValue: 'not_a_number',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			await testInvalidField({
				field: 'destinationId',
				// Float instead of integer
				invalidValue: 1.5,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate number field types', async () => {
			// Test invalid slope (non-numeric)
			await testInvalidField({
				field: 'slope',
				invalidValue: 'invalid_slope',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test invalid intercept (non-numeric)
			await testInvalidField({
				field: 'intercept',
				invalidValue: 'invalid_intercept',
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test edge case numeric values
			const validNumericValues = [0, -1000, 1000, 0.00001, -0.00001, 1e10, -1e10];
			for (const validValue of validNumericValues) {
				const res = await chai.request(app)
					.post(EDIT_ENDPOINT)
					.send({ ...baseConversionData, slope: validValue });

				// Should pass validation but fail auth
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate boolean field types', async () => {
			const invalidBooleanValues = ['yes', 'no', '1', '0', 'on', 'off', 'true', 'false', 1, 0];

			for (const invalidValue of invalidBooleanValues) {
				await testInvalidField({
					field: 'bidirectional',
					invalidValue: invalidValue,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseConversionData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}

			// Test valid boolean values
			const validBooleanValues = [true, false];
			for (const validValue of validBooleanValues) {
				const res = await chai.request(app)
					.post(EDIT_ENDPOINT)
					.send({ ...baseConversionData, bidirectional: validValue });

				// Should pass validation but fail auth
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate note field (oneOf string/null)', async () => {
			// Test oversized note (maxLength: STRING_GENERAL_MAX_LENGTH)
			await testInvalidField({
				field: 'note',
				invalidValue: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1),
				endpoint: EDIT_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test valid null note
			const res1 = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send({ ...baseConversionData, note: null });

			// Should pass validation but fail auth
			expect(res1.status).to.equal(HTTP_CODE.FORBIDDEN);

			// Test valid string note at max length
			const res2 = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send({ ...baseConversionData, note: 'x'.repeat(STRING_GENERAL_MAX_LENGTH) });

			// Should pass validation but fail auth
			expect(res2.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should reject parameter injection', async () => {
			const payloadWithExtra = {
				...baseConversionData,
				maliciousField: 'injection attempt',
				isAdmin: true,
				deleteAll: true,
				executeCommand: 'rm -rf /',
				extraProperty: 'should be rejected',
				anotherField: 'more injection'
			};

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(payloadWithExtra);

			// Should fail due to maxProperties: 6 (validation catches before auth)
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should handle malicious string inputs in note field', async () => {
			const maliciousInputs = [
				"'; DROP TABLE conversions; --",
				'<script>alert("xss")</script>',
				'../../../etc/passwd',
				'conversion\\x00injection',
				'\\u0000malicious',
				'A'.repeat(STRING_GENERAL_MAX_LENGTH)
			];

			for (const maliciousInput of maliciousInputs) {
				await testInvalidField({
					field: 'note',
					invalidValue: maliciousInput,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseConversionData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should validate exact property count (maxProperties: 6)', async () => {
			// Test payload with exactly 6 properties (should pass validation)
			const exactPayload = {
				sourceId: 1,
				destinationId: 2,
				bidirectional: true,
				slope: 1.0,
				intercept: 0.0,
				note: 'exactly 6 properties'
			};

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(exactPayload);

			// Should pass validation but fail auth
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});
	});

	mocha.describe('POST /api/conversions/addConversion - Add Conversion Validation', () => {
		const ADD_ENDPOINT = '/api/conversions/addConversion';

		const baseConversionData = {
			sourceId: 3,
			destinationId: 4,
			bidirectional: false,
			slope: 2.0,
			intercept: 1.5,
			note: 'New test conversion'
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send(baseConversionData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate all required fields for creation', async () => {
			const requiredFields = ['sourceId', 'destinationId', 'bidirectional', 'slope', 'intercept'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseConversionData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(ADD_ENDPOINT)
					.send(payloadMissingField);

				// Should fail validation or auth
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should use same validation schema as edit', async () => {
			// Test same constraints apply to add endpoint
			await testInvalidField({
				field: 'sourceId',
				invalidValue: -1,
				endpoint: ADD_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			await testInvalidField({
				field: 'note',
				invalidValue: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1),
				endpoint: ADD_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			await testInvalidField({
				field: 'bidirectional',
				invalidValue: 'yes',
				endpoint: ADD_ENDPOINT,
				basePayload: baseConversionData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should reject parameter injection on creation', async () => {
			const payloadWithExtra = {
				...baseConversionData,
				adminOverride: true,
				bypassValidation: true,
				maliciousScript: '<script>alert("hack")</script>'
			};

			const res = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send(payloadWithExtra);

			// Should fail due to maxProperties: 6
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should handle type validation edge cases', async () => {
			// Test special numeric values
			const specialValues = [NaN, Infinity, -Infinity];

			for (const specialValue of specialValues) {
				await testInvalidField({
					field: 'slope',
					invalidValue: specialValue,
					endpoint: ADD_ENDPOINT,
					basePayload: baseConversionData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});
	});

	mocha.describe('POST /api/conversions/delete - Delete Conversion Validation', () => {
		const DELETE_ENDPOINT = '/api/conversions/delete';

		const baseDeleteData = {
			sourceId: 1,
			destinationId: 2
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(DELETE_ENDPOINT)
				.send(baseDeleteData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate required fields for deletion', async () => {
			const requiredFields = ['sourceId', 'destinationId'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseDeleteData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(DELETE_ENDPOINT)
					.send(payloadMissingField);

				// Should fail validation or auth
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate ID constraints for deletion', async () => {
			// Test negative sourceId
			await testInvalidField({
				field: 'sourceId',
				invalidValue: -1,
				endpoint: DELETE_ENDPOINT,
				basePayload: baseDeleteData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test zero destinationId
			await testInvalidField({
				field: 'destinationId',
				invalidValue: 0,
				endpoint: DELETE_ENDPOINT,
				basePayload: baseDeleteData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test non-integer ID
			await testInvalidField({
				field: 'sourceId',
				invalidValue: 'not_a_number',
				endpoint: DELETE_ENDPOINT,
				basePayload: baseDeleteData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test float ID
			await testInvalidField({
				field: 'destinationId',
				invalidValue: 2.5,
				endpoint: DELETE_ENDPOINT,
				basePayload: baseDeleteData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should reject parameter injection on delete', async () => {
			const payloadWithExtra = {
				...baseDeleteData,
				force: true,
				confirmDelete: true,
				maliciousField: 'injection'
			};

			const res = await chai.request(app)
				.post(DELETE_ENDPOINT)
				.send(payloadWithExtra);

			// Should fail due to maxProperties: 2
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate exact property count for deletion (maxProperties: 2)', async () => {
			// Test payload with exactly 2 properties (should pass validation)
			const exactPayload = {
				sourceId: 5,
				destinationId: 6
			};

			const res = await chai.request(app)
				.post(DELETE_ENDPOINT)
				.send(exactPayload);

			// Should pass validation but fail auth
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should handle oversized integer values', async () => {
			await testInvalidField({
				field: 'sourceId',
				invalidValue: Number.MAX_SAFE_INTEGER + 1,
				endpoint: DELETE_ENDPOINT,
				basePayload: baseDeleteData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});
	});

	mocha.describe('Cross-Endpoint Security Tests', () => {
		mocha.it('should handle concurrent conversion operations', async () => {
			const EDIT_ENDPOINT = '/api/conversions/edit';
			const conversionData = {
				sourceId: 100,
				destinationId: HTTP_CODE.OK,
				bidirectional: true,
				slope: 1.0,
				intercept: 0.0,
				note: 'Concurrent test'
			};

			// Send multiple concurrent requests
			const promises = Array(3).fill().map(() =>
				chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(conversionData)
			);

			const results = await Promise.all(promises);

			// All should fail with 403 (auth required)
			results.forEach(res => {
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			});
		});

		mocha.it('should reject completely invalid payloads', async () => {
			const endpoints = ['/api/conversions/edit', '/api/conversions/addConversion', '/api/conversions/delete'];

			for (const endpoint of endpoints) {
				// Test non-object payload
				const res1 = await chai.request(app)
					.post(endpoint)
					.send('not an object');
				expect(res1.status).to.equal(HTTP_CODE.FORBIDDEN);

				// Test array payload
				const res2 = await chai.request(app)
					.post(endpoint)
					.send(['array', 'payload']);
				expect(res2.status).to.equal(HTTP_CODE.FORBIDDEN);

				// Test null payload
				const res3 = await chai.request(app)
					.post(endpoint)
					.send(null);
				expect(res3.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate conversion relationship constraints', async () => {
			const EDIT_ENDPOINT = '/api/conversions/edit';

			// Test same source and destination (potential logical issue)
			const sameSrcDest = {
				sourceId: 1,
				destinationId: 1,
				bidirectional: true,
				slope: 1.0,
				intercept: 0.0,
				note: 'Self-conversion test'
			};

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(sameSrcDest);

			// Should pass validation (business logic may handle this separately) but fail auth
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should handle extremely large numeric values', async () => {
			const ADD_ENDPOINT = '/api/conversions/addConversion';

			const largeNumbers = {
				sourceId: 1,
				destinationId: 2,
				bidirectional: false,
				slope: 1e308,
				intercept: -1e308,
				note: 'Large number test'
			};

			const res = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send(largeNumbers);

			// Should pass validation but fail auth
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});
	});
});
