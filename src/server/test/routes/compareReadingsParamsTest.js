/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app } = require('../common');
const {
	validateCommaSeparatedIdPatterns,
	expectValidCommaSeparatedIds
} = require('../util/validationHelpers');
const { HTTP_CODE } = require('../../util/readingsUtils');
const {	STRING_GENERAL_MAX_LENGTH } = require('../../util/validationConstants');

mocha.describe('Compare Readings Parameter Validation', () => {

	mocha.describe('GET /api/compareReadings/meters/:meter_ids - Meter Compare Readings', () => {
		const BASE_METER_ENDPOINT = '/api/compareReadings/meters';

		const validQuery = {
			curr_start: '2023-01-01T00:00:00.000Z',
			curr_end: '2023-01-02T00:00:00.000Z',
			shift: 'P1D',
			graphicUnitId: '1'
		};

		mocha.describe('URL Parameter Validation - meter_ids', () => {
			mocha.it('should accept valid single meter ID', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: BASE_METER_ENDPOINT,
					validValues: ['1'],
					query: validQuery
				});
			});

			mocha.it('should accept valid comma-separated meter IDs', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: BASE_METER_ENDPOINT,
					validValues: ['1,2,3'],
					query: validQuery
				});
			});

			// TODO: Consider consolidating invalid ID pattern tests into a shared helper or expanding
			// test coverage with additional edge cases (e.g., Unicode characters, URL encoding attacks).
			mocha.it('should reject invalid meter ID patterns', async () => {
				await validateCommaSeparatedIdPatterns({
					baseEndpoint: BASE_METER_ENDPOINT,
					invalidValues: [
						'abc',           // Non-numeric
						'1,',            // Trailing comma
						',1',            // Leading comma
						'1,,2',          // Double comma
						'1;2',           // Wrong separator
						'1.5',           // Decimal
						'-1',            // Negative
						'1 2',           // Space separator
					],
					query: validQuery
				});
			});

			mocha.it('should reject extremely long meter ID strings (DoS prevention)', async () => {
				// Creates very long comma-separated list
				const longMeterIds = '1,'.repeat(STRING_GENERAL_MAX_LENGTH + 1);

				const res = await chai.request(app)
					.get(`${BASE_METER_ENDPOINT}/${longMeterIds}`)
					.query(validQuery);

				expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
			});
		});

		mocha.describe('Query Parameter Validation', () => {
			mocha.it('should require all query parameters', async () => {
				const requiredParams = ['curr_start', 'curr_end', 'shift', 'graphicUnitId'];

				for (const param of requiredParams) {
					const incompleteQuery = { ...validQuery };
					delete incompleteQuery[param];

					const res = await chai.request(app)
						.get(`${BASE_METER_ENDPOINT}/1`)
						.query(incompleteQuery);

					expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
				}
			});

			mocha.it('should reject extra query parameters (parameter injection prevention)', async () => {
				const queryWithExtra = {
					...validQuery,
					maliciousParam: 'injection_attempt'
				};

				const res = await chai.request(app)
					.get(`${BASE_METER_ENDPOINT}/1`)
					.query(queryWithExtra);

				expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
			});

			// TODO: re-enable once compareReadings rejects invalid ISO values without hitting DB
			mocha.it.skip('should validate curr_start parameter', async () => {
				// Test extremely long date string (DoS prevention)
				const dateStart = '2023-01-01T00:00:00.000Z';
				const longDateString = dateStart + 'x'.repeat(STRING_GENERAL_MAX_LENGTH - dateStart.length + 1);

				const res = await chai.request(app)
					.get(`${BASE_METER_ENDPOINT}/1`)
					.query({
						...validQuery,
						curr_start: longDateString
					});

				expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
			});

			// TODO: re-enable once compareReadings rejects invalid ISO values without hitting DB
			mocha.it.skip('should validate curr_end parameter', async () => {
				// Test extremely long date string (DoS prevention)
				const longDateString = 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1);

				const res = await chai.request(app)
					.get(`${BASE_METER_ENDPOINT}/1`)
					.query({
						...validQuery,
						curr_end: longDateString
					});

				expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
			});

			// TODO: re-enable once compareReadings rejects invalid ISO values without hitting DB
			mocha.it.skip('should validate shift parameter', async () => {
				// Test extremely long duration string (DoS prevention)
				const durationStart = 'P1D';
				const longDurationString = durationStart + 'x'.repeat(STRING_GENERAL_MAX_LENGTH - durationStart.length + 1);

				const res = await chai.request(app)
					.get(`${BASE_METER_ENDPOINT}/1`)
					.query({
						...validQuery,
						shift: longDurationString
					});

				expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
			});

			mocha.it('should validate graphicUnitId parameter', async () => {
				const invalidUnitIds = [
					'abc',              // Non-numeric
					'1.5',              // Decimal
					'-1',               // Negative
					'1a',               // Mixed alphanumeric
					'x'.repeat(30),     // Extremely long string (DoS prevention)
				];

				for (const invalidId of invalidUnitIds) {
					const res = await chai.request(app)
						.get(`${BASE_METER_ENDPOINT}/1`)
						.query({
							...validQuery,
							graphicUnitId: invalidId
						});

					expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
				}
			});
		});
	});

	mocha.describe('GET /api/compareReadings/groups/:group_ids - Group Compare Readings', () => {
		const BASE_GROUP_ENDPOINT = '/api/compareReadings/groups';

		const validQuery = {
			curr_start: '2023-01-01T00:00:00.000Z',
			curr_end: '2023-01-02T00:00:00.000Z',
			shift: 'P1D',
			graphicUnitId: '1'
		};

		mocha.describe('URL Parameter Validation - group_ids', () => {
			mocha.it('should accept valid single group ID', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: BASE_GROUP_ENDPOINT,
					validValues: ['1'],
					query: validQuery
				});
			});

			mocha.it('should accept valid comma-separated group IDs', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: BASE_GROUP_ENDPOINT,
					validValues: ['1,2,3'],
					query: validQuery
				});
			});

			mocha.it('should reject invalid group ID patterns', async () => {
				await validateCommaSeparatedIdPatterns({
					baseEndpoint: BASE_GROUP_ENDPOINT,
					invalidValues: [
						'abc',           // Non-numeric
						'1,',            // Trailing comma
						',1',            // Leading comma
						'1,,2',          // Double comma
						'1;2',           // Wrong separator
						'1.5',           // Decimal
						'-1',            // Negative
						'1 2',           // Space separator
					],
					query: validQuery
				});
			});

			mocha.it('should reject extremely long group ID strings (DoS prevention)', async () => {
				// Creates very long comma-separated list
				const longGroupIds = '1,'.repeat(STRING_GENERAL_MAX_LENGTH + 1);

				const res = await chai.request(app)
					.get(`${BASE_GROUP_ENDPOINT}/${longGroupIds}`)
					.query(validQuery);

				expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
			});
		});

		mocha.describe('Query Parameter Validation', () => {
			mocha.it('should require all query parameters', async () => {
				const requiredParams = ['curr_start', 'curr_end', 'shift', 'graphicUnitId'];

				for (const param of requiredParams) {
					const incompleteQuery = { ...validQuery };
					delete incompleteQuery[param];

					const res = await chai.request(app)
						.get(`${BASE_GROUP_ENDPOINT}/1`)
						.query(incompleteQuery);

					expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
				}
			});

			mocha.it('should reject extra query parameters (parameter injection prevention)', async () => {
				const queryWithExtra = {
					...validQuery,
					maliciousParam: 'injection_attempt'
				};

				const res = await chai.request(app)
					.get(`${BASE_GROUP_ENDPOINT}/1`)
					.query(queryWithExtra);

				expect(res.status).to.equal(HTTP_CODE.BAD_REQUEST);
			});

			// Query parameter validation is identical for both endpoints, 
			// so we don't need to repeat all the tests
		});
	});

	mocha.describe('Security Attack Prevention', () => {
		const validQuery = {
			curr_start: '2023-01-01T00:00:00.000Z',
			curr_end: '2023-01-02T00:00:00.000Z',
			shift: 'P1D',
			graphicUnitId: '1'
		};

		mocha.it('should prevent parameter injection attacks via extra fields', async () => {
			const maliciousQueries = [
				{ ...validQuery, sqlInjection: "'; DROP TABLE meters; --" },
				{ ...validQuery, xss: '<script>alert("xss")</script>' },
				{ ...validQuery, prototype污染: '__proto__' },
				{ ...validQuery, unexpectedField: 'value' },
			];

			for (const maliciousQuery of maliciousQueries) {
				const res1 = await chai.request(app)
					.get('/api/compareReadings/meters/1')
					.query(maliciousQuery);

				const res2 = await chai.request(app)
					.get('/api/compareReadings/groups/1')
					.query(maliciousQuery);

				expect(res1.status).to.equal(HTTP_CODE.BAD_REQUEST);
				expect(res2.status).to.equal(HTTP_CODE.BAD_REQUEST);
			}
		});

		// TODO: re-enable after rate-limiting friendly test setup
		mocha.it.skip('should prevent DoS attacks via oversized parameters', async () => {
			const oversizedTests = [
				{
					name: 'oversized date strings',
					query: { ...validQuery, curr_start: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1) }
				},
				{
					name: 'oversized duration strings',
					query: { ...validQuery, shift: 'x'.repeat(STRING_GENERAL_MAX_LENGTH + 1) }
				},
				{
					name: 'oversized unit ID',
					query: { ...validQuery, graphicUnitId: 'x'.repeat(NUMERIC_ID_MAX_LENGTH + 1) }
				}
			];

			for (const test of oversizedTests) {
				const res1 = await chai.request(app)
					.get('/api/compareReadings/meters/1')
					.query(test.query);

				const res2 = await chai.request(app)
					.get('/api/compareReadings/groups/1')
					.query(test.query);

				expect(res1.status).to.equal(HTTP_CODE.BAD_REQUEST);
				expect(res2.status).to.equal(HTTP_CODE.BAD_REQUEST);
			}
		});
	});
});
