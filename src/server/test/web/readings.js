/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*
	This file tests the readings retrieval API.

	see: https://github.com/OpenEnergyDashboard/DevDocs/blob/main/testing/testing.md for information on loading readings test data

	Directions for creating reading tests (not needed for rejection tests)
		1) Download csv files from DevDocs (link above) and add to a readingsData folder in this directory (src/server/test/web/readingsData)
		2) define arrays of data for units, conversions, a test meter using testing csv (optionally a second test meter and group for group testing)
		3) load these arrays by invoking prepareTest(* defined data arrays *)
		4) create an array of values using the expected values csv by calling parseExpectedCsv on the file and assigning the return value
		5) write your test using expectReadingToEqualExpected to check the values and createTimeString
*/

const { chai, mocha, expect, app, testDB, recreateDB } = require('../common');
const { TimeInterval } = require('../../../common/TimeInterval');
const { insertUnits, insertConversions, insertMeters, insertGroups } = require('../../util/insertData');
const Unit = require('../../models/Unit');
const { redoCik } = require('../../services/graph/redoCik');
const { refreshAllReadingViews } = require('../../services/refreshAllReadingViews');
const readCsv = require('../../services/pipeline-in-progress/readCsv');
const moment = require('moment');

const ETERNITY = TimeInterval.unbounded();
// Readings should be accurate to many decimal places, but allow some wiggle room for database and javascript conversions
const DELTA = 0.0000001;
const METER_ID = 1;
const GROUP_ID = 1;
// Some common HTTP status response codes
const HTTP_CODE = {
	OK: 200,
	FOUND: 302,
	BAD_REQUEST: 400,
	NOT_FOUND: 404
};

/**
 * Initialize test database, call the functions to insert data into the database,
 * then redoCik and refresh views to ensure everything works.
 * @param {array} unitData parameters for insertUnits
 * @param {array} conversionData parameters for insertConversions
 * @param {array} meterData parameters for insertMeters
 * @param {array} groupData  parameters for insertGroups (optional)
 */
async function prepareTest(unitData, conversionData, meterData, groupData = []) {
	const conn = testDB.getConnection();
	await insertUnits(unitData, conn);
	await insertConversions(conversionData, conn);
	await insertMeters(meterData, conn);
	await insertGroups(groupData, conn);
	await redoCik(conn);
	await refreshAllReadingViews();
}

/**
 * Call this function to generate an array of arrays of a csv file.
 * This function will remove the first 'row' from the csv file (typically the column names)
 * @param {string} fileName path to the 'expected values' csv file to correspond with the readings file
 * @returns {array} array of arrays similar in format to the expected JSON output of the api
 */
async function parseExpectedCsv(fileName) {
	let expectedCsv = await readCsv(fileName);
	expectedCsv.shift();
	return expectedCsv;
};

/**
 * Checks reading generated from csv and compares against the expected readings csv
 * @param {request.Response} res the response to the HTTP GET request from Chai
 * @param {array} expected the returned array from parseExpectedCsv
 */
function expectReadingToEqualExpected(res, expected) {
	expect(res).to.be.json;
	expect(res).to.have.status(HTTP_CODE.OK);
	expect(res.body).to.have.property(`${METER_ID}`).to.have.lengthOf(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(res.body).to.have.property(`${METER_ID}`).to.have.property(`${i}`).to.have.property('reading').to.be.closeTo(Number(expected[i][0]), DELTA);
		expect(res.body).to.have.property(`${METER_ID}`).to.have.property(`${i}`).to.have.property('startTimestamp').to.equal(Date.parse(expected[i][1]));
		expect(res.body).to.have.property(`${METER_ID}`).to.have.property(`${i}`).to.have.property('endTimestamp').to.equal(Date.parse(expected[i][2]));
	}
}

/**
 * Create an ISO standard date range to use as a timeInterval query for the API
 * @param {string} startDay formatted as YYYY-MM-DD
 * @param {string} startTime formatted as HH:MM:SS
 * @param {string} endDay formatted as YYYY-MM-DD
 * @param {string} endTime formatted as HH:MM:SS
 * @returns {string} a string with the format '20XX-XX-XXT00:00:00Z_20XX-XX-XXT00:00:00Z'
 */
function createTimeString(startDay, startTime, endDay, endTime) {
	const dateString = new TimeInterval(moment(startDay + ' ' + startTime), moment(endDay + ' ' + endTime));
	return dateString.toString();
}

// TODO
// Test readings from meters at different rates (15 min, 23 min)
// Test some more date ranges as specified in DevDocs/testing/testing.md
// Test bar charts
// Test groups

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for line charts', () => {
			mocha.describe('for meters', () => {
				// A reading response should have a reading, startTimestamp, and endTimestamp key
				mocha.it('response should have valid reading and timestamps,', async () => {
					// Create 2D arrays for units, conversions, and meters to feed into the database
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID]];
					// Load the data into the database
					await prepareTest(unitData, conversionData, meterData);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					// unitReadings should return as json
					expect(res).to.be.json;
					// the route should not return a bad request
					expect(res).to.have.status(HTTP_CODE.OK);
					// Check if the first element returned by the API is the correct format
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('endTimestamp');
				});
				// Test using a date range of infinity, which should return as days
				mocha.it('should have the expected readings for 15 minute reading intervals and quantity units with +-inf start/end time', async () => {
					// Create 2D arrays for units, conversions, and meters to feed into the database
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID]];
					// Load the data into the database
					await prepareTest(unitData, conversionData, meterData);
					// Load the expected response data from the corresponding csv file
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf.csv');
					// Create a request to the API for unbounded reading times and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					// Check that the API reading is equal to what it is expected to equal
					expectReadingToEqualExpected(res, expected);
				});
				// This test is effectively the same as the last, but we specify the date range
				// Should return daily point readings
				mocha.it('should have the expected readings for 15 minute reading intervals and quantity units with explicit start/end time', async() => {
					// Specify units, conversions, and meters
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID]];
					// Load the data
					await prepareTest(unitData, conversionData, meterData);
					// Load and parse the corresponding expected values from csv
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
					// Create a request to the API for the date range specified using createTimeString and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: 1 });
					expectReadingToEqualExpected(res, expected);
				});
				// This date range is on the threshold of returning daily point readings, 61 days
				mocha.it('should generate daily points & middle readings for a 61 day period', async() => {
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID]];
					await prepareTest(unitData, conversionData, meterData);
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-25%00#00#00.csv');
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-25', '00:00:00'), graphicUnitId: 1 });
					expectReadingToEqualExpected(res, expected);
				});
				// 60 days gives hourly points & middle readings
				mocha.it('should generate hourly points & middle readings in a 60 day period', async() => {
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID]];
					await prepareTest(unitData, conversionData, meterData);
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: 1 });
					expectReadingToEqualExpected(res, expected);
				});
				// TODO need the proper csv files for the flow and raw units
				/* 				mocha.it('should have the expected readings for 15 minute reading intervals and flow units', async () => {
									const unitData = [
										['kW', '', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'kilowatts'],
										['Electric', '', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
									];
									const conversionData = [['Electric', 'kW', false, 1, 0, 'Electric → kW']];
									const meterData = [['Electric kW', 'Electric', 'kW', true, undefined,
										'special meter', 'test/web/readingsData/{missing}.csv', false, METER_ID]];

									await prepareTest(unitData, conversionData, meterData);
									const expected = await parseExpectedCsv();

									const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
										.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
									expectReadingToEqualExpected(res, expected);
								});
								mocha.it('should have the expected readings for 15 minute reading intervals and raw units', async () => {
									const unitData = [
										['c', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'Celsius'],
										['Degrees', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
									];
									const conversionData = [['Degrees', 'c', false, 1, 0, 'Degrees → c']];
									const meterData = [['Degrees Celsius', 'Degrees', 'c', true, undefined,
										'special meter', '', false, METER_ID]];

									await prepareTest(unitData, conversionData, meterData);
									const expected = await parseExpectedCsv();

									const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
										.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
									expectReadingToEqualExpected(res, expected)
								});  */
				// When an invalid unit is added to a meter and loaded to the db, the API should return an empty array
				mocha.it('should return an empty json object for an invalid unit', async () => {
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['invalidUnit', '', Unit.unitRepresentType.UNUSED, 1, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'Invalid Unit']
					];
					const conversionData = [['invalidUnit', 'kWh', false, 1, 0, 'invalidUnit → kWh']];
					const meterData = [['Invalid', 'invalidUnit', 'kWh', true, undefined,
						'invalid meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID]];
					await prepareTest(unitData, conversionData, meterData);
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expect(res).to.be.json;
					expect(res.body).to.have.property(`${METER_ID}`).to.be.empty;
				});
			});
			mocha.describe('for groups', () => {
				// A reading response should have a reading, startTimestamp, and endTimestamp key
				mocha.it('response should have valid reading and timestamps,', async () => {
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [
						['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
							'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID],
						['Electric Utility kWh 2-6', 'Electric_Utility', 'kWh', true, undefined,
							'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, (METER_ID + 1)]
					];
					const groupData = [['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], [], GROUP_ID]];
					await prepareTest(unitData, conversionData, meterData, groupData);
					const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					// unitReadings should be returning json
					expect(res).to.be.json;
					// the route should not return a bad request
					expect(res).to.have.status(HTTP_CODE.OK);
					expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('endTimestamp');
				});
			});
		});
		mocha.describe('for bar charts', () => {
			// The logic here is effectively the same as the line charts, however bar charts have an added
			// barWidthDays parameter that must be accounted for, which adds a few extra steps
			mocha.describe('for meters', () => {
				mocha.it('response should have a valid reading, startTimestamp, and endTimestamp', async () => {
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID]];
					await prepareTest(unitData, conversionData, meterData);
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: 1
						});
					expect(res).to.be.json;
					expect(res).to.have.status(HTTP_CODE.OK);
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('endTimestamp');
				});
			});
			mocha.describe('for groups', () => {
				mocha.it('response should have a valid reading, startTimestamp, and endTimestamp', async () => {
					const unitData = [
						['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'],
						['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 'special unit']
					];
					const conversionData = [['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh']];
					const meterData = [
						['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
							'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, METER_ID],
						['Electric Utility kWh 2-6', 'Electric_Utility', 'kWh', true,
							undefined, 'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false, (METER_ID + 1)]
					];
					const groupData = [['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], [], GROUP_ID]];
					await prepareTest(unitData, conversionData, meterData, groupData);
					const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: 1
						});
					expect(res).to.be.json;
					expect(res).to.have.status(HTTP_CODE.OK);
					expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('endTimestamp');
				});
			})
		});
	});
	// These tests check the API behavior when improper calls are made, typically with incomplete parameters
	// The API should return status code 400 regardless of what is in the database, so no data is loaded in these tests
	mocha.describe('rejection tests, test behavior with invalid api calls', () => {
		mocha.describe('for line charts', () => {
			mocha.describe('for meters', () => {
				// A request is required to have both timeInterval and graphicUnitId as parameters
				mocha.it('rejects requests without a timeInterval or graphicUnitId', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`);
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have timeInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString() });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
			});
			mocha.describe('for groups', () => {
				// A request is required to have both timeInterval and graphicUnitId as parameters
				mocha.it('rejects requests without a timeInterval or graphicUnitId', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`);
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have timeInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
						.query({ graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
						.query({ timeInterval: ETERNITY.toString() });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
			});
		});
		mocha.describe('for bar charts', () => {
			// The logic here is effectively the same as the line charts, however bar charts have an added
			// barWidthDays parameter that must me accounted for, which adds a few extra steps
			mocha.describe('for meters', () => {
				mocha.it('rejects requests without a timeInterval or barWidthDays or graphicUnitId', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`);
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a barWidthDays', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a timeInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({ barWidthDays: 1, graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), barWidthDays: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
			});
			mocha.describe('for groups', () => {
				mocha.it('rejects requests without a timeInterval or barWidthDays or graphicUnitId', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`);
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a barWidthDays', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a timeInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
						.query({ barWidthDays: 1, graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
						.query({ timeInterval: ETERNITY.toString(), barWidthDays: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
			});
		});
	});
});