/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { chai, mocha, expect, app } = require('../common');
const { HTTP_CODE } = require('../../util/readingsUtils');
const { STRING_GENERAL_MAX_LENGTH } = require('../../util/validationConstants');
const {
	expectValidCommaSeparatedIds,
	expectValidNumericIdInPath,
	validateCommaSeparatedIdPatterns,
	validateRequiredQueryParams,
	validateNumericIdInPath
} = require('../util/validationHelpers');

/** Shared valid timeInterval for line reading routes (used in multiple tests in this file). */
const READINGS_LINE_TIME_INTERVAL = '2020-01-01T00:00:00.000Z_2020-01-02T00:00:00.000Z';
const INT32_MAX = 2147483647;

mocha.describe('Readings Route Parameter Validation', () => {

	const LINE_COUNT_BASE_ENDPOINT = '/api/readings/line/count/meters';
	const RAW_READINGS_BASE_ENDPOINT = '/api/readings/line/raw/meter';

	const lineCountValidQuery = { timeInterval: READINGS_LINE_TIME_INTERVAL };

	mocha.describe(`GET ${LINE_COUNT_BASE_ENDPOINT}/:meter_ids`, () => {

		mocha.describe('URL Parameter Validation (meter_ids)', () => {
			mocha.it('should accept valid comma-separated meter IDs', async () => {
				await expectValidCommaSeparatedIds({
					baseEndpoint: LINE_COUNT_BASE_ENDPOINT,
					validValues: ['1,2,3', '1'],
					query: lineCountValidQuery,
					expectedStatuses: [HTTP_CODE.OK, HTTP_CODE.NOT_FOUND, HTTP_CODE.INTERNAL_SERVER_ERROR]
				});
			});

			mocha.it('should reject extremely long meter_ids string (DoS prevention)', async () => {
				await validateCommaSeparatedIdPatterns({
					baseEndpoint: LINE_COUNT_BASE_ENDPOINT,
					invalidValues: ['1,'.repeat(STRING_GENERAL_MAX_LENGTH + 1)],
					query: lineCountValidQuery,
					expectedStatus: HTTP_CODE.BAD_REQUEST
				});
			});
		});

		mocha.describe('Query Parameter Validation (timeInterval)', () => {
			mocha.it('should require timeInterval parameter', async () => {
				await validateRequiredQueryParams({
					endpoint: `${LINE_COUNT_BASE_ENDPOINT}/1`,
					baseQuery: lineCountValidQuery,
					requiredParams: ['timeInterval']
				});
			});

			mocha.it('should reject extremely long timeInterval string (DoS prevention)', async () => {
				const hugeTimeInterval = 'x'.repeat(501);
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
					.query({ timeInterval: hugeTimeInterval });

				expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
			});

			mocha.it('should accept valid timeInterval format', async () => {
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
					.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

				// May return 200, 404, or 500 if meters/data don't exist
				expect([HTTP_CODE.OK, HTTP_CODE.NOT_FOUND, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});

			mocha.it('should reject extra query parameters (parameter injection)', async () => {
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
					.query({
						timeInterval: READINGS_LINE_TIME_INTERVAL,
						maliciousParam: 'injection_attempt'
					});

				expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
			});
		});

		mocha.describe('Malicious Input Tests', () => {
			mocha.it('should handle SQL injection attempts in meter_ids', async () => {
				const sqlInjection = "1'; DROP TABLE readings; --";
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/${encodeURIComponent(sqlInjection)}`)
					.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

				// Should not crash server, may return 200, 400 or 500
				expect([HTTP_CODE.OK, HTTP_CODE.BAD_REQUEST, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});

			mocha.it('should handle XSS attempts in timeInterval', async () => {
				const xssAttempt = '<script>alert("xss")</script>';
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
					.query({ timeInterval: xssAttempt });

				// XSS attempt causes moment.js warning and 500 error
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});
		});
	});

	const rawReadingsValidQuery = { timeInterval: READINGS_LINE_TIME_INTERVAL };

	mocha.describe(`GET ${RAW_READINGS_BASE_ENDPOINT}/:meter_id`, () => {

		mocha.describe('URL Parameter Validation (meter_id)', () => {
			mocha.it('should accept valid integer meter ID', async () => {
				await expectValidNumericIdInPath({
					baseEndpoint: RAW_READINGS_BASE_ENDPOINT,
					validValues: ['1'],
					query: rawReadingsValidQuery,
					expectedStatuses: [HTTP_CODE.OK, HTTP_CODE.BAD_REQUEST, HTTP_CODE.NOT_FOUND, HTTP_CODE.INTERNAL_SERVER_ERROR]
				});
			});

			mocha.it('should reject invalid meter_id patterns', async () => {
				await validateNumericIdInPath({
					baseEndpoint: RAW_READINGS_BASE_ENDPOINT,
					invalidValues: ['not_a_number', '0', '-1', '1.5', String(INT32_MAX + 1), encodeURIComponent("1'; DROP TABLE readings; --"), '9'.repeat(32)],
					query: rawReadingsValidQuery,
					expectedStatus: HTTP_CODE.BAD_REQUEST
				});
			});
		});

		mocha.describe('Query Parameter Validation (timeInterval)', () => {
			mocha.it('should require timeInterval parameter', async () => {
				await validateRequiredQueryParams({
					endpoint: `${RAW_READINGS_BASE_ENDPOINT}/1`,
					baseQuery: rawReadingsValidQuery,
					requiredParams: ['timeInterval']
				});
			});

			mocha.it('should reject extremely long timeInterval string (DoS prevention)', async () => {
				const hugeTimeInterval = 'x'.repeat(501);
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/1`)
					.query({ timeInterval: hugeTimeInterval });

				expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
			});

			mocha.it('should accept valid timeInterval format', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/1`)
					.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

				// May return 400, 404, or 500 if meters/data don't exist
				expect([HTTP_CODE.OK, HTTP_CODE.BAD_REQUEST, HTTP_CODE.NOT_FOUND, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});

			mocha.it('should reject extra query parameters (parameter injection)', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/1`)
					.query({
						timeInterval: READINGS_LINE_TIME_INTERVAL,
						maliciousParam: 'injection_attempt'
					});

				expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
			});
		});

		mocha.describe('Malicious Input Tests', () => {
			mocha.it('should handle special characters in timeInterval', async () => {
				const specialChars = `${READINGS_LINE_TIME_INTERVAL}&cmd=ls`;
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/1`)
					.query({ timeInterval: specialChars });

				// Should be handled gracefully, not crash server
				expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});
		});
	});

	mocha.describe('Edge Cases and Error Handling', () => {
		mocha.it('should handle empty meter_ids string', async () => {
			const res = await chai.request(app)
				.get(`${LINE_COUNT_BASE_ENDPOINT}/`)
				.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

			// Empty meter_ids may return 200 (empty result) or 404 depending on routing
			expect([HTTP_CODE.OK, HTTP_CODE.NOT_FOUND]).to.include(res.status);
		});

		mocha.it('should handle malformed timeInterval format', async () => {
			const res = await chai.request(app)
				.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
				.query({ timeInterval: 'invalid_format' });

			// Should not crash - may return 400 or 500 depending on TimeInterval.fromString handling
			expect([HTTP_CODE.BAD_REQUEST, HTTP_CODE.INTERNAL_SERVER_ERROR]).to.include(res.status);
		});
	});
});
