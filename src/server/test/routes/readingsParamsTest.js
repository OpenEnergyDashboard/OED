/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { chai, mocha, expect, app, testDB } = require('../common');
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
		// Shared test state populated by setUpRawExportTest before each test case
		// These values identify the meter and time range inserted by createRawExportTestData
		let testMeterID;
		let testTimeInterval;
		/**
		 * Inserts a test meter with two readings into the database
		 * which are used to produce a predictable estimataed file size.
		 * @param conn The database connection to use.
		 * @returns An object with the inserted meter id and matching time interval string.
		 */
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
				insertedMeterID: meter.id,
				rawExportTimeInterval: '2020-01-01T00:00:00Z_2020-01-01T02:00:00Z'
			};
		}

		/**
		 * Logs in as given user and returns the generated auth token.
		 * The User object is expected to contain a plain-text password to use for login.
		 * @param user The user to log in as. 
		 * @returns The auth token generated by the login route.
		 */
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

		/**
		 * Create and insert a user with the given role into the database.
		 * Hashed password is inserted into the database before local User object
		 * is updated with plain-text password to be used for login.
		 * @param role The role to assign to the created User 
		 * @param conn The database connection to use. 
		 * @returns The inserted user with its plain-text password available for login. 
		 */
		async function createUserWithRole(role, conn) {
			const password = `${role}password`;
			const user = new User(
				undefined,
				`raw-export-${role}-${Date.now()}@example.invalid`,
				bcrypt.hashSync(password, 10),
				role
			);
			await user.insert(conn);
			user.password = password;
			return user;
		}

		/**
	 	* Creates a test user with the given role, logs in as that user,
	 	* and returns the generated auth token.
	 	* @param role The role to assign to the created user.
	 	* @param conn The database connection to use.
	 	* @returns The auth token for the created user.
	 	*/
		async function getTokenForRole(role, conn) {
			const user = await createUserWithRole(role, conn);
			return getTokenForUser(user);
		}
		
		/**
	 	* Sets up the raw export test data and updates the default file size limit.
	 	* The inserted meter ID and time interval are stored for use by the test cases.
	 	* @param limit The default file size limit to set in preferences.
	 	*/
		async function setUpRawExportTest(limit) {
			conn = testDB.getConnection();
			const testData = await createRawExportTestData(conn);
			testMeterID = testData.insertedMeterID;
			testTimeInterval = testData.rawExportTimeInterval;
			await Preferences.update({ defaultFileSizeLimit: limit }, conn);
		}

		/**
	 	* Sends a raw export request as either an unauthenticated user or a user
	 	* with the given role, then verifies the response status.
	 	* @param role The role to log in as, or null for an unauthenticated request.
	 	* @param expectedStatus The expected HTTP response status.
	 	*/
		async function expectRawExportStatus(role, expectedStatus) {
			let req = chai.request(app)
				.get(`${RAW_READINGS_BASE_ENDPOINT}/${testMeterID}`)
				.query({ timeInterval: testTimeInterval });

			if (role !== null) {
				const token = await getTokenForRole(role, conn);
				req = req.set('token', token);
			}

			const res = await req;
			expect(res).to.have.status(expectedStatus);
		}
		mocha.describe('Estimated File Size is within File Size Limit', () => {
			mocha.beforeEach(async () => {
				// Set a high file size limit to ensure the estimated file size is within the limit
				await setUpRawExportTest(0.001);
			});

			const cases = [
				{ label: 'unauthenticated users', role: null, expectedStatus: HTTP_CODES.OK },
				{ label: 'CSV users', role: User.role.CSV, expectedStatus: HTTP_CODES.OK },
				{ label: 'OBVIUS users', role: User.role.OBVIUS, expectedStatus: HTTP_CODES.OK },
				{ label: 'EXPORT users', role: User.role.EXPORT, expectedStatus: HTTP_CODES.OK },
				{ label: 'ADMIN users', role: User.role.ADMIN, expectedStatus: HTTP_CODES.OK }
			];

			for (const testCase of cases) {
				mocha.it(`accepts ${testCase.label}`, async () => {
					await expectRawExportStatus(testCase.role, testCase.expectedStatus);
				});
			}
		});

		mocha.describe('Estimated File Size Exceeds File Size Limit', () => {
			mocha.beforeEach(async () => {
				// Set a low file size limit to ensure the estimated file size exceeds the limit
				await setUpRawExportTest(0.00015);
			});

			const cases = [
				{ label: 'unauthenticated users', role: null, expectedStatus: HTTP_CODES.FORBIDDEN },
				{ label: 'CSV users', role: User.role.CSV, expectedStatus: HTTP_CODES.FORBIDDEN },
				{ label: 'OBVIUS users', role: User.role.OBVIUS, expectedStatus: HTTP_CODES.FORBIDDEN },
				{ label: 'EXPORT users', role: User.role.EXPORT, expectedStatus: HTTP_CODES.OK },
				{ label: 'ADMIN users', role: User.role.ADMIN, expectedStatus: HTTP_CODES.OK }
			];

			for (const testCase of cases) {
				const action = testCase.expectedStatus === HTTP_CODES.OK ? 'accepts' : 'rejects';

				mocha.it(`${action} ${testCase.label}`, async () => {
					await expectRawExportStatus(testCase.role, testCase.expectedStatus);
				});
			}
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
