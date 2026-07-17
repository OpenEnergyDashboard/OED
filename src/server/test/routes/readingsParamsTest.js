/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const { HTTP_CODES } = require('../../util/httpCodes');
const { STRING_GENERAL_MAX_LENGTH } = require('../../util/validationConstants');
const {
	expectValidCommaSeparatedIds,
	expectValidNumericIdInPath,
	validateCommaSeparatedIdPatterns,
	validateRequiredQueryParams,
	validateNumericIdInPath
} = require('../util/validationHelpers');

const moment = require('moment');
const bcrypt = require('bcryptjs')
const Preferences = require('../../models/Preferences');
const { getConnection } = require('../../db');
const Point = require('../../models/Point');
const Reading = require('../../models/Reading');
const Meter = require('../../models/Meter');
const User = require('../../models/User');

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
					expectedStatuses: [HTTP_CODES.OK, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]
				});
			});

			mocha.it('should reject extremely long meter_ids string (DoS prevention)', async () => {
				await validateCommaSeparatedIdPatterns({
					baseEndpoint: LINE_COUNT_BASE_ENDPOINT,
					invalidValues: ['1,'.repeat(STRING_GENERAL_MAX_LENGTH + 1)],
					query: lineCountValidQuery,
					expectedStatus: HTTP_CODES.BAD_REQUEST
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

				expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
			});

			mocha.it('should accept valid timeInterval format', async () => {
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
					.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

				// May return 200, 404, or 500 if meters/data don't exist
				expect([HTTP_CODES.OK, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});

			mocha.it('should reject extra query parameters (parameter injection)', async () => {
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
					.query({
						timeInterval: READINGS_LINE_TIME_INTERVAL,
						maliciousParam: 'injection_attempt'
					});

				expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
			});
		});

		mocha.describe('Malicious Input Tests', () => {
			mocha.it('should handle SQL injection attempts in meter_ids', async () => {
				const sqlInjection = "1'; DROP TABLE readings; --";
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/${encodeURIComponent(sqlInjection)}`)
					.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

				// Should not crash server, may return 200, 400 or 500
				expect([HTTP_CODES.OK, HTTP_CODES.BAD_REQUEST, HTTP_CODES.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});

			mocha.it('should reject XSS attempts in timeInterval', async () => {
				const xssAttempt = '<script>alert("xss")</script>';
				const res = await chai.request(app)
					.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
					.query({ timeInterval: xssAttempt });

				expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
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
					expectedStatuses: [HTTP_CODES.OK, HTTP_CODES.BAD_REQUEST, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]
				});
			});

			mocha.it('should reject invalid meter_id patterns', async () => {
				await validateNumericIdInPath({
					baseEndpoint: RAW_READINGS_BASE_ENDPOINT,
					invalidValues: ['not_a_number', '0', '-1', '1.5', String(INT32_MAX + 1), encodeURIComponent("1'; DROP TABLE readings; --"), '9'.repeat(32)],
					query: rawReadingsValidQuery,
					expectedStatus: HTTP_CODES.BAD_REQUEST
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

				expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
			});

			mocha.it('should accept valid timeInterval format', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/1`)
					.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

				// May return 400, 404, or 500 if meters/data don't exist
				expect([HTTP_CODES.OK, HTTP_CODES.BAD_REQUEST, HTTP_CODES.NOT_FOUND, HTTP_CODES.INTERNAL_SERVER_ERROR]).to.include(res.status);
			});

			mocha.it('should reject extra query parameters (parameter injection)', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/1`)
					.query({
						timeInterval: READINGS_LINE_TIME_INTERVAL,
						maliciousParam: 'injection_attempt'
					});

				expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
			});
		});

		mocha.describe('Malicious Input Tests', () => {
			mocha.it('should reject special characters in timeInterval', async () => {
				const specialChars = `${READINGS_LINE_TIME_INTERVAL}&cmd=ls`;
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/1`)
					.query({ timeInterval: specialChars });

				expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
			});
		});
	});


	mocha.describe('Raw Export File Size and User Role Authorization', () => {
		let conn;
		let meterID;
		let timeInterval;
		//insert a meter with 2 readings into testdb
		async function createRawExportTestData(conn) {
			const gps = new Point(1, 1);
			const start = moment.utc('2020-01-01T00:00:00Z');
			const meterName ='Raw Export Test Meter';
			const meter = new Meter(
				undefined,
				meterName,
				null,
				false,
				false,
				Meter.type.MAMAC,
				null,
				gps
			);
			await meter.insert(conn);
			await Reading.insertAll([
				new Reading(meter.id, 10, start.clone(), start.clone().add(1, 'hour')),
				new Reading(meter.id, 20, start.clone().add(1, 'hour'), start.clone().add(2, 'hours'))
			], conn);
			return {
				meterID: meter.id,
				timeInterval: '2020-01-01T00:00:00Z_2020-01-01T02:00:00Z'
			};
		}
		//used specifically to get token from testuser who is ADMIN
		async function getTokenForUser(user) {
			const res = await chai.request(app)
				.post('/api/login')
				.send({
					username: user.username,
					password: user.password
				});
			expect(res).to.have.status(HTTP_CODES.OK);
			expect(res.body).to.have.property('token');
			return res.body.token;
		}
		//used to make users for roles CSV, EXPORT, OBVIUS
		async function createUserWithRole(role, conn) {
			const user = new User(
				undefined,
				`raw-export-${role}-${Date.now()}@example.invalid`,
				bcrypt.hashSync('password', 10),
				role
			);
			user.password = 'password';
			await user.insert(conn);
			return user;
		}
		async function getTokenForRole(role, conn) {
			const user = await createUserWithRole(role, conn);
			return getTokenForUser(user);
		}
		//helper to set up file size limit and insert test meter
		async function setUpRawExportTest(limit) {
			conn = testDB.getConnection();
			const testData = await createRawExportTestData(conn);
			meterID = testData.meterID;
			timeInterval = testData.timeInterval;
			await Preferences.update({ defaultFileSizeLimit: limit }, conn);
		}
		mocha.describe('Estimated File Size is within File Size Limit', () => {

			let csvToken;
			let exportToken;
			let obviusToken;
			let adminToken;

			mocha.beforeEach(async () => {
				await setUpRawExportTest(100000000) // Set a high file size limit to ensure the estimated file size is within the limit;

				csvToken = await getTokenForRole(User.role.CSV, conn);
				exportToken = await getTokenForRole(User.role.EXPORT, conn);
				obviusToken = await getTokenForRole(User.role.OBVIUS, conn);
				adminToken = await getTokenForRole(User.role.ADMIN, conn);
			});

			mocha.it('accepts unauthenticated users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.OK);
			});

			mocha.it('accepts CSV users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', csvToken)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.OK);
			});

			mocha.it('accepts OBVIUS users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', obviusToken)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.OK);
			});

			mocha.it('accepts EXPORT users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', exportToken)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.OK);
			});

			mocha.it('accepts ADMIN users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', adminToken)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.OK);
			});

		});
		mocha.describe('Estimated File Size Exceeds File Size Limit', () => {

			mocha.beforeEach(async () => {
				await setUpRawExportTest(0.00015);

				csvToken = await getTokenForRole(User.role.CSV, conn);
				exportToken = await getTokenForRole(User.role.EXPORT, conn);
				obviusToken = await getTokenForRole(User.role.OBVIUS, conn);
				adminToken = await getTokenForRole(User.role.ADMIN, conn);
			});

			mocha.it('rejects unauthenticated users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.FORBIDDEN);
			});

			mocha.it('rejects CSV users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', csvToken)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.FORBIDDEN);
			});

			mocha.it('rejects OBVIUS users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', obviusToken)
					.query({ timeInterval });

				expect(res).to.have.status(HTTP_CODES.FORBIDDEN);
			});

			mocha.it('accepts EXPORT users', async () => {
				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', exportToken)
					.query({ timeInterval });
					
				expect(res).to.have.status(HTTP_CODES.OK);
			});

			mocha.it('accepts ADMIN users', async () => {
				const adminToken = await getTokenForUser(testUser);

				const res = await chai.request(app)
					.get(`${RAW_READINGS_BASE_ENDPOINT}/${meterID}`)
					.set('token', adminToken)
					.query({ timeInterval });
					
				expect(res).to.have.status(HTTP_CODES.OK);
			});
		});
	});

	mocha.describe('Edge Cases and Error Handling', () => {
		mocha.it('should handle empty meter_ids string', async () => {
			const res = await chai.request(app)
				.get(`${LINE_COUNT_BASE_ENDPOINT}/`)
				.query({ timeInterval: READINGS_LINE_TIME_INTERVAL });

			// Empty meter_ids may return 200 (empty result) or 404 depending on routing
			expect([HTTP_CODES.OK, HTTP_CODES.NOT_FOUND]).to.include(res.status);
		});

		mocha.it('should reject malformed timeInterval format', async () => {
			const res = await chai.request(app)
				.get(`${LINE_COUNT_BASE_ENDPOINT}/1`)
				.query({ timeInterval: 'invalid_format' });

			expect(res).to.have.status(HTTP_CODES.BAD_REQUEST);
		});
	});
});
