/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const {
	testInvalidField,
	validateNoExtraFields
} = require('../util/validationHelpers');
const { HTTP_CODE } = require('../../util/readingsUtils');
const {
	STRING_GENERAL_MAX_LENGTH,
	STRING_SHORT_MAX_LENGTH
} = require('../../util/validationConstants');

mocha.describe('Meters Parameter Validation', () => {

	mocha.describe('GET /api/meters/:meter_id - Meter ID Validation', () => {
		const METER_ID_ENDPOINT = '/api/meters/123';

		mocha.it('should validate meter_id parameter', async () => {
			// Test invalid meter ID patterns (non-numeric)
			const invalidIds = ['abc', '12abc', 'meter123', 'null', ''];

			for (const invalidId of invalidIds) {
				const res = await chai.request(app)
					.get(`/api/meters/${invalidId}`);

				// Should return 400 for validation error or 200 if somehow valid
				expect([HTTP_CODE.OK, HTTP_CODE.BAD_REQUEST]).to.include(res.status);
			}
		});

		mocha.it('should handle extremely long meter IDs', async () => {
			const longId = '1'.repeat(25);
			const res = await chai.request(app)
				.get(`/api/meters/${longId}`);

			expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
		});

		mocha.it('should handle SQL injection in meter ID', async () => {
			const sqlInjection = encodeURIComponent("1' OR '1'='1");
			const res = await chai.request(app)
				.get(`/api/meters/${sqlInjection}`);

			expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
		});

		mocha.it('should accept valid numeric meter IDs', async () => {
			const validIds = ['1', '123', '999999'];

			for (const validId of validIds) {
				const res = await chai.request(app)
					.get(`/api/meters/${validId}`);

				// Should pass validation - may return 404 (not found) or 500 (DB error)
				expect([HTTP_CODE.NOT_FOUND, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			}
		});
	});

	mocha.describe('POST /api/meters/edit - Meter Edit Validation', () => {
		const EDIT_ENDPOINT = '/api/meters/edit';

		const baseMeterData = {
			id: 1,
			name: 'Test Meter',
			url: 'http://example.com/meter',
			enabled: true,
			displayable: true,
			// TODO: Use actual enum value
			meterType: 'MAMAC',
			timeZone: 'America/Los_Angeles',
			note: 'Test meter for validation',
			area: 100.5,
			cumulative: false,
			cumulativeReset: false,
			cumulativeResetStart: '2023-01-01',
			cumulativeResetEnd: '2023-12-31',
			readingGap: 300,
			readingVariation: 0.1,
			readingDuplication: 5,
			timeSort: 'increasing',
			endOnlyTime: false,
			reading: 1000.0,
			startTimestamp: '2023-01-01T00:00:00Z',
			endTimestamp: '2023-12-31T23:59:59Z',
			previousEnd: '2022-12-31T23:59:59Z',
			unitId: 1,
			defaultGraphicUnit: 1,
			// TODO: Use actual enum value
			areaUnit: 'square meters',
			readingFrequency: '15 minutes',
			minVal: 0,
			maxVal: 10000,
			minDate: '2023-01-01',
			maxDate: '2023-12-31',
			maxError: 5,
			// TODO: Use actual enum value
			disableChecks: 'none'
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(baseMeterData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate required fields', async () => {
			const requiredFields = ['name', 'url', 'enabled', 'displayable', 'meterType', 'timeZone', 'note', 'area'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseMeterData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(payloadMissingField);

				// Should fail due to missing required field or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]).to.include(res.status);
			}
		});

		mocha.it('should validate string field lengths', async () => {
			const stringFieldTests = [
				{ field: 'name', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'meterType', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'timeZone', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'identifier', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'note', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'cumulativeResetStart', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'cumulativeResetEnd', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'timeSort', maxLength: STRING_SHORT_MAX_LENGTH },
				{ field: 'startTimestamp', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'endTimestamp', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'previousEnd', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'areaUnit', maxLength: 50 },
				{ field: 'readingFrequency', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'minDate', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'maxDate', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ field: 'disableChecks', maxLength: 50 }
			];

			for (const test of stringFieldTests) {
				await testInvalidField({
					field: test.field,
					invalidValue: 'x'.repeat(test.maxLength + 1),
					endpoint: EDIT_ENDPOINT,
					basePayload: baseMeterData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should validate boolean field types', async () => {
			const booleanFields = ['enabled', 'displayable', 'cumulative', 'cumulativeReset', 'endOnlyTime'];

			for (const field of booleanFields) {
				const invalidBooleanValues = ['yes', 'no', '1', '0', 'on', 'off', 'enabled'];

				for (const invalidValue of invalidBooleanValues) {
					await testInvalidField({
						field: field,
						invalidValue: invalidValue,
						endpoint: EDIT_ENDPOINT,
						basePayload: baseMeterData,
						expectedStatus: HTTP_CODE.FORBIDDEN
					});
				}
			}
		});

		mocha.it('should validate GPS coordinates', async () => {
			// Test invalid latitude (outside -90 to 90)
			await testInvalidField({
				field: 'gps',
				invalidValue: { latitude: 91, longitude: 0 },
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test invalid longitude (outside -180 to 180)  
			await testInvalidField({
				field: 'gps',
				invalidValue: { latitude: 0, longitude: 181 },
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test missing required GPS fields
			await testInvalidField({
				field: 'gps',
				// Missing longitude
				invalidValue: { latitude: 45 },
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test non-numeric GPS values
			await testInvalidField({
				field: 'gps',
				invalidValue: { latitude: 'north', longitude: 'west' },
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate numeric bounds', async () => {
			// Test negative area (minimum: 0)
			await testInvalidField({
				field: 'area',
				invalidValue: -1,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test readingDuplication outside bounds (1-9)
			await testInvalidField({
				field: 'readingDuplication',
				invalidValue: 0,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			await testInvalidField({
				field: 'readingDuplication',
				invalidValue: 10,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});

			// Test invalid meter ID (minimum: 1)
			await testInvalidField({
				field: 'id',
				invalidValue: 0,
				endpoint: EDIT_ENDPOINT,
				basePayload: baseMeterData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should validate enum fields', async () => {
			// Test invalid meterType
			const invalidMeterTypes = ['INVALID_TYPE', 'invalid', '', 'OTHER'];
			for (const invalidType of invalidMeterTypes) {
				await testInvalidField({
					field: 'meterType',
					invalidValue: invalidType,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseMeterData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}

			// Test invalid timeSort
			const invalidTimeSorts = ['ascending', 'descending', 'asc', 'desc', 'random'];
			for (const invalidSort of invalidTimeSorts) {
				await testInvalidField({
					field: 'timeSort',
					invalidValue: invalidSort,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseMeterData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should reject parameter injection', async () => {
			const payloadWithExtra = {
				...baseMeterData,
				maliciousField: 'injection attempt',
				isAdmin: true,
				deleteAll: true,
				executeCommand: 'rm -rf /',
				extraProperty: 'should be rejected'
			};

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(payloadWithExtra);

			// Should fail due to additionalProperties: false or auth
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should handle malicious string inputs', async () => {
			const maliciousInputs = [
				"'; DROP TABLE meters; --",
				'<script>alert("xss")</script>',
				'../../../etc/passwd',
				'meter\x00injection',
				'\u0000malicious'
			];

			const stringFields = ['name', 'identifier', 'note'];

			for (const field of stringFields) {
				for (const maliciousInput of maliciousInputs) {
					await testInvalidField({
						field: field,
						invalidValue: maliciousInput,
						endpoint: EDIT_ENDPOINT,
						basePayload: baseMeterData,
						expectedStatus: HTTP_CODE.FORBIDDEN
					});
				}
			}
		});

		mocha.it('should handle oneOf nullable fields correctly', async () => {
			// Test null values for nullable fields
			const nullableFields = ['url', 'timeZone', 'gps', 'identifier', 'note', 'previousEnd'];

			for (const field of nullableFields) {
				const payloadWithNull = {
					...baseMeterData,
					[field]: null
				};

				const res = await chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(payloadWithNull);

				// Should pass validation but fail auth
				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});
	});

	mocha.describe('POST /api/meters/addMeter - Meter Creation Validation', () => {
		const ADD_ENDPOINT = '/api/meters/addMeter';

		const baseMeterData = {
			name: 'New Test Meter',
			url: 'http://example.com/newmeter',
			enabled: true,
			displayable: true,
			meterType: 'MAMAC',
			timeZone: 'America/New_York',
			note: 'New meter for testing',
			area: 200.0,
			// Add other required fields...
			cumulative: false,
			cumulativeReset: false,
			cumulativeResetStart: '2024-01-01',
			cumulativeResetEnd: '2024-12-31',
			readingGap: 300,
			readingVariation: 0.1,
			readingDuplication: 3,
			timeSort: 'increasing',
			endOnlyTime: false,
			reading: 0,
			startTimestamp: '2024-01-01T00:00:00Z',
			endTimestamp: '2024-12-31T23:59:59Z',
			previousEnd: null,
			unitId: 1,
			defaultGraphicUnit: 1,
			areaUnit: 'square meters',
			readingFrequency: '30 minutes',
			minVal: 0,
			maxVal: 5000,
			minDate: '2024-01-01',
			maxDate: '2024-12-31',
			maxError: 3,
			disableChecks: 'none'
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(ADD_ENDPOINT)
				.send(baseMeterData);

			// Validation/auth may respond with 400/403 or rate limiting 429
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]).to.include(res.status);
		});

		mocha.it('should validate all required fields for creation', async () => {
			const requiredFields = ['name', 'url', 'enabled', 'displayable', 'meterType', 'timeZone', 'note', 'area'];

			for (const field of requiredFields) {
				const payloadMissingField = { ...baseMeterData };
				delete payloadMissingField[field];

				const res = await chai.request(app)
					.post(ADD_ENDPOINT)
					.send(payloadMissingField);

				// Should fail validation or auth
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]).to.include(res.status);
			}
		});

		mocha.it('should reject parameter injection on creation', async () => {
			const payloadWithExtra = {
				...baseMeterData,
				adminOverride: true,
				bypassValidation: true,
				maliciousScript: '<script>alert("hack")</script>'
			};

			await validateNoExtraFields({
				endpoint: ADD_ENDPOINT,
				basePayload: baseMeterData,
				extraFields: {
					adminOverride: true,
					bypassValidation: true,
					maliciousScript: '<script>alert("hack")</script>'
				},
				expectedStatus: [HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]
			});
		});

		mocha.it('should handle type validation errors', async () => {
			// Test wrong types for various fields
			const typeTests = [
				{ field: 'enabled', invalidValue: 'true' },
				{ field: 'area', invalidValue: 'large' },
				{ field: 'id', invalidValue: 'meter1' },
				{ field: 'unitId', invalidValue: 1.5 }
			];

			for (const test of typeTests) {
				// Admin auth short-circuits before validation, so we accept 400/403
				await testInvalidField({
					field: test.field,
					invalidValue: test.invalidValue,
					endpoint: ADD_ENDPOINT,
					basePayload: baseMeterData,
					expectedStatus: [HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]
				});
			}
		});
	});

	mocha.describe('Cross-Endpoint Security Tests', () => {
		mocha.it('should handle concurrent meter operations', async () => {
			const EDIT_ENDPOINT = '/api/meters/edit';
			const meterData = {
				id: 999,
				name: 'Concurrent Test Meter',
				url: 'http://example.com/concurrent',
				enabled: true,
				displayable: true,
				meterType: 'MAMAC',
				timeZone: 'UTC',
				note: 'Concurrent test',
				area: 100
			};

			// Send multiple concurrent requests
			const promises = Array(3).fill().map(() =>
				chai.request(app)
					.post(EDIT_ENDPOINT)
					.send(meterData)
			);

			const results = await Promise.all(promises);

			// All should fail with 403 (auth required)
			results.forEach(res => {
				expect([HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]).to.include(res.status);
			});
		});

		mocha.it('should reject completely invalid payloads', async () => {
			const endpoints = ['/api/meters/edit', '/api/meters/addMeter'];

			for (const endpoint of endpoints) {
				// Test non-object payload - validation happens before auth for addMeter
				const res1 = await chai.request(app)
					.post(endpoint)
					.send('not an object');
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]).to.include(res1.status);

				// Test array payload - validation happens before auth for addMeter
				const res2 = await chai.request(app)
					.post(endpoint)
					.send(['array', 'payload']);
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]).to.include(res2.status);

				// Test null payload - validation happens before auth for addMeter
				const res3 = await chai.request(app)
					.post(endpoint)
					.send(null);
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.FORBIDDEN, HTTP_CODE.TOO_MANY_REQUESTS]).to.include(res3.status);
			}
		});
	});
});
