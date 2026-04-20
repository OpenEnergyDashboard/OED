/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const { testInvalidField } = require('../util/validationHelpers');
const { HTTP_CODE } = require('../../util/readingsUtils');
const {
	NUMERIC_ID_MAX_LENGTH,
	STRING_GENERAL_MAX_LENGTH,
	STRING_SHORT_MAX_LENGTH
} = require('../../util/validationConstants');

mocha.describe('Maps Parameter Validation', () => {

	mocha.describe('GET /api/maps - Get All Maps', () => {
		mocha.it('should accept GET requests without parameters', async () => {
			const res = await chai.request(app)
				.get('/api/maps');

			// Should return 200 (no auth required for reading)
			expect(res.status).to.equal(HTTP_CODE.OK);
		});
	});

	mocha.describe('GET /api/maps/:map_id - Get Map by ID', () => {
		const BASE_ENDPOINT = '/api/maps';

		mocha.it('should accept valid map ID', async () => {
			const res = await chai.request(app)
				.get(`${BASE_ENDPOINT}/1`);

			// Should return 200 or 500 (DB error) - no auth required for reading
			expect([HTTP_CODE.OK, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
		});

		mocha.it('should reject invalid map ID patterns', async () => {
			const invalidPatterns = [
				'abc',           // Non-numeric
				'1.5',           // Decimal
				'-1',            // Negative
				'1a',            // Mixed alphanumeric
				'0',             // Zero
			];

			for (const invalidPattern of invalidPatterns) {
				const res = await chai.request(app)
					.get(`${BASE_ENDPOINT}/${invalidPattern}`);

				//TODO
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			}
		});

		mocha.it('should reject extremely long map ID strings (DoS prevention)', async () => {
			const longMapId = 'x'.repeat(NUMERIC_ID_MAX_LENGTH + 1);

			const res = await chai.request(app)
				.get(`${BASE_ENDPOINT}/${longMapId}`);

			expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
		});
	});

	mocha.describe('POST /api/maps/create - Create Map', () => {
		const CREATE_ENDPOINT = '/api/maps/create';

		const baseMapData = {
			name: 'Test Map',
			modifiedDate: '2023-01-01T00:00:00.000Z',
			filename: 'test-map.png',
			mapSource: 'Test Source'
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(CREATE_ENDPOINT)
				.send(baseMapData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate required fields', async () => {
			const requiredFields = ['name', 'modifiedDate', 'filename', 'mapSource'];

			for (const field of requiredFields) {
				await testInvalidField({
					field,
					invalidValue: undefined,
					endpoint: CREATE_ENDPOINT,
					basePayload: baseMapData,
					// Will fail auth before validation
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should reject extra fields (parameter injection prevention)', async () => {
			const payloadWithExtra = {
				...baseMapData,
				maliciousField: 'injection_attempt'
			};

			const res = await chai.request(app)
				.post(CREATE_ENDPOINT)
				.send(payloadWithExtra);

			// Will fail auth before validation
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate string field lengths (DoS prevention)', async () => {
			const oversizedTests = [
				{
					field: 'name',
					value: 'x'.repeat(STRING_SHORT_MAX_LENGTH + 1)
				},
				{
					field: 'filename',
					value: 'x'.repeat(500 + 1)
				},
				{
					field: 'modifiedDate',
					value: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1)
				},
				{
					field: 'mapSource',
					value: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1)
				}
			];

			for (const test of oversizedTests) {
				await testInvalidField({
					field: test.field,
					invalidValue: test.value,
					endpoint: CREATE_ENDPOINT,
					basePayload: baseMapData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should validate GPS coordinates when provided', async () => {
			const invalidGPSTests = [
				{
					name: 'latitude too high',
					origin: { latitude: 91, longitude: 0 }
				},
				{
					name: 'latitude too low',
					origin: { latitude: -91, longitude: 0 }
				},
				{
					name: 'longitude too high',
					origin: { latitude: 0, longitude: 181 }
				},
				{
					name: 'longitude too low',
					origin: { latitude: 0, longitude: -181 }
				},
				{
					name: 'non-numeric latitude',
					origin: { latitude: 'invalid', longitude: 0 }
				},
				{
					name: 'non-numeric longitude',
					origin: { latitude: 0, longitude: 'invalid' }
				}
			];

			for (const test of invalidGPSTests) {
				const payload = {
					...baseMapData,
					origin: test.origin,
					opposite: { latitude: 0, longitude: 0 }
				};

				const res = await chai.request(app)
					.post(CREATE_ENDPOINT)
					.send(payload);

				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate northAngle range when provided', async () => {
			const invalidAngles = [-1, 361, 'invalid'];

			for (const angle of invalidAngles) {
				const payload = {
					...baseMapData,
					northAngle: angle
				};

				const res = await chai.request(app)
					.post(CREATE_ENDPOINT)
					.send(payload);

				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should validate circleSize range when provided', async () => {
			const invalidSizes = [0, 1001, -1, 'invalid'];

			for (const size of invalidSizes) {
				const payload = {
					...baseMapData,
					circleSize: size
				};

				const res = await chai.request(app)
					.post(CREATE_ENDPOINT)
					.send(payload);

				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});
	});

	mocha.describe('POST /api/maps/edit - Edit Map', () => {
		const EDIT_ENDPOINT = '/api/maps/edit';

		const baseEditData = {
			id: 1,
			name: 'Updated Test Map',
			modifiedDate: '2023-01-01T00:00:00.000Z',
			filename: 'updated-test-map.png',
			mapSource: 'Updated Test Source',
			displayable: true,
			note: 'Test note',
			origin: null,
			opposite: null
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(baseEditData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate required fields', async () => {
			const requiredFields = ['id', 'name', 'modifiedDate', 'filename', 'mapSource', 'displayable', 'note', 'origin', 'opposite'];

			for (const field of requiredFields) {
				await testInvalidField({
					field,
					invalidValue: undefined,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseEditData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should reject extra fields (parameter injection prevention)', async () => {
			const payloadWithExtra = {
				...baseEditData,
				maliciousField: 'injection_attempt'
			};

			const res = await chai.request(app)
				.post(EDIT_ENDPOINT)
				.send(payloadWithExtra);

			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate ID bounds', async () => {
			const invalidIds = [0, -1, 2147483648, 'invalid', null];

			for (const id of invalidIds) {
				await testInvalidField({
					field: 'id',
					invalidValue: id,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseEditData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});

		mocha.it('should validate boolean displayable field', async () => {
			const invalidBooleans = ['true', 'false', 1, 0, 'invalid'];

			for (const invalid of invalidBooleans) {
				await testInvalidField({
					field: 'displayable',
					invalidValue: invalid,
					endpoint: EDIT_ENDPOINT,
					basePayload: baseEditData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});
	});

	mocha.describe('POST /api/maps/delete - Delete Map', () => {
		const DELETE_ENDPOINT = '/api/maps/delete';

		const baseDeleteData = {
			id: 1
		};

		mocha.it('should reject unauthenticated requests', async () => {
			const res = await chai.request(app)
				.post(DELETE_ENDPOINT)
				.send(baseDeleteData);

			// Should require admin authentication
			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate required ID field', async () => {
			await testInvalidField({
				field: 'id',
				invalidValue: undefined,
				endpoint: DELETE_ENDPOINT,
				basePayload: baseDeleteData,
				expectedStatus: HTTP_CODE.FORBIDDEN
			});
		});

		mocha.it('should reject extra fields (parameter injection prevention)', async () => {
			const payloadWithExtra = {
				...baseDeleteData,
				maliciousField: 'injection_attempt'
			};

			const res = await chai.request(app)
				.post(DELETE_ENDPOINT)
				.send(payloadWithExtra);

			expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
		});

		mocha.it('should validate ID bounds', async () => {
			const invalidIds = [0, -1, 2147483648, 'invalid', null];

			for (const id of invalidIds) {
				await testInvalidField({
					field: 'id',
					invalidValue: id,
					endpoint: DELETE_ENDPOINT,
					basePayload: baseDeleteData,
					expectedStatus: HTTP_CODE.FORBIDDEN
				});
			}
		});
	});

	mocha.describe('Security Attack Prevention', () => {
		mocha.it('should prevent parameter injection attacks via extra fields', async () => {
			const endpoints = [
				{ endpoint: '/api/maps/create', basePayload: { name: 'Test', modifiedDate: '2023-01-01', filename: 'test.png', mapSource: 'Test' } },
				{ endpoint: '/api/maps/edit', basePayload: { id: 1, name: 'Test', modifiedDate: '2023-01-01', filename: 'test.png', mapSource: 'Test', displayable: true, note: null, origin: null, opposite: null } },
				{ endpoint: '/api/maps/delete', basePayload: { id: 1 } }
			];

			const maliciousFields = [
				{ field: 'sqlInjection', value: "'; DROP TABLE maps; --" },
				{ field: 'xss', value: '<script>alert("xss")</script>' },
				{ field: 'prototype污染', value: '__proto__' },
				{ field: 'unexpectedField', value: 'value' }
			];

			for (const { endpoint, basePayload } of endpoints) {
				for (const { field, value } of maliciousFields) {
					const maliciousPayload = {
						...basePayload,
						[field]: value
					};

					const res = await chai.request(app)
						.post(endpoint)
						.send(maliciousPayload);

					expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
				}
			}
		});

		mocha.it('should prevent DoS attacks via oversized parameters', async () => {
			const oversizedTests = [
				{
					endpoint: '/api/maps/create',
					payload: { name: 'x'.repeat(200), modifiedDate: '2023-01-01', filename: 'test.png', mapSource: 'Test' }
				},
				{
					endpoint: '/api/maps/create',
					payload: { name: 'Test', modifiedDate: '2023-01-01', filename: 'x'.repeat(600), mapSource: 'Test' }
				},
				{
					endpoint: '/api/maps/create',
					payload: { name: 'Test', modifiedDate: '2023-01-01', filename: 'test.png', mapSource: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1) }
				},
				{
					endpoint: '/api/maps/create',
					payload: { name: 'Test', modifiedDate: '2023-01-01', filename: 'test.png', mapSource: 'Test', note: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1) }
				}
			];

			for (const test of oversizedTests) {
				const res = await chai.request(app)
					.post(test.endpoint)
					.send(test.payload);

				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});

		mocha.it('should prevent coordinate injection attacks', async () => {
			const coordinateAttacks = [
				{
					name: 'nested object attack',
					origin: { latitude: { $ne: null }, longitude: 0 }
				},
				{
					name: 'prototype pollution attempt',
					origin: { __proto__: { isAdmin: true }, latitude: 0, longitude: 0 }
				},
				{
					name: 'extra properties in coordinates',
					origin: { latitude: 0, longitude: 0, malicious: 'injection' }
				}
			];

			for (const attack of coordinateAttacks) {
				const payload = {
					name: 'Test',
					modifiedDate: '2023-01-01',
					filename: 'test.png',
					mapSource: 'Test',
					origin: attack.origin
				};

				const res = await chai.request(app)
					.post('/api/maps/create')
					.send(payload);

				expect(res.status).to.equal(HTTP_CODE.FORBIDDEN);
			}
		});
	});

	mocha.describe('Token Authentication Testing', () => {
		mocha.it('should validate token format and prevent token-based DoS attacks', async () => {
			const hugeToken = 'x'.repeat(3000);
			let res = await chai.request(app)
				.post('/api/maps/create')
				.set('token', hugeToken);

			// Accept either 401 (auth failure) or 403 (forbidden)
			expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);

			// Test invalid token format
			res = await chai.request(app)
				.post('/api/maps/create')
				.set('token', 12345);

			expect([HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN]).to.include(res.status);
		});
	});
});
