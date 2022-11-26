/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 

	This file tests the readings retrieval API.

	see: https://github.com/OpenEnergyDashboard/DevDocs/blob/main/testing/testing.md for information on loading readings test data

	Directions for creating reading tests (not needed for rejection tests)
		1) Download csv files from devdocs (link above) and add to a readingsData folder in this directory (src/server/test/web/readingsData)
		2) define arrays of data for units, conversions, a test meter using testing csv (optionally a second test meter and group for group testing) 
		3) load these arrays by invoking prepareTest(* defined data arrays *)
		4) create an array of values using the expected values csv by calling parseExpectedCsv on the file and assigning the return value
		5) write your test
*/

const moment = require('moment');
const { chai, mocha, expect, app, testDB, recreateDB } = require('../common');
const { TimeInterval } = require('../../../common/TimeInterval');
const { insertUnits, insertConversions, insertMeters, insertGroups } = require('../../util/insertData');
const Unit = require('../../models/Unit');
const { redoCik } = require('../../services/graph/redoCik');
const { refreshAllReadingViews } = require('../../services/refreshAllReadingViews');
const readCsv = require('../../services/pipeline-in-progress/readCsv');
const ETERNITY = TimeInterval.unbounded();
const DAY = moment.duration({ 'days': 1 });
const delta = 0.0000001	// Readings should be accurate to many decimal places, but allow some wiggle room for database and javascript conversions	
const HTTP_CODE = { 	// Some common HTTP status response codes
	OK: 200,
	FOUND: 302,
	BAD_REQUEST: 400,
	NOT_FOUND: 404
};

/**
 * Call the functions to insert data into the database with one call, then redoCik and refresh views to ensure everything works.
 * @param {array} unitDataOne parameters for insertUnits
 * @param {array} unitDataTwo parameters for insertUnits
 * @param {array} conversionData parameters for insertConversions
 * @param {array} meterDataOne parameters for insertMeters
 * @param {array} meterDataTwo parameters for insertMeters (optional)
 * @param {array} groupData  parameters for insertGroups (optional)
 */
async function prepareTest(unitDataOne, unitDataTwo, conversionData, meterDataOne, meterDataTwo = undefined, groupData = undefined) {
	const conn = testDB.getConnection();
	await insertUnits([unitDataOne, unitDataTwo], conn);
	await insertConversions([conversionData], conn);
	if (meterDataTwo == undefined || groupData == undefined) {
		await insertMeters([meterDataOne], conn);
	}
	else {
		await insertMeters([meterDataOne, meterDataTwo], conn);
		await insertGroups([groupData], conn);
	}
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
	let expectedReadings = [];
	expectedCsv.shift(); 
	expectedCsv.forEach((reading) => {
		if (reading[0] != '') 
			expectedReadings.push(reading);
	})
	return expectedReadings;
};

/**
 * Checks reading generated from csv and compares against the expected readings csv
 * @param {request.Response} res the response to the HTTP GET request from Chai
 * @param {array} expected the returned array from parseExpectedCsv
 */
function expectReadingToEqualExpected(res, expected) {
	expect(res).to.be.json;
	expect(res).to.have.status(HTTP_CODE.OK);
	expect(res.body).to.have.property('1').to.have.lengthOf(expected.length);
	for(let i = 0; i < expected.length; i++) {
		expect(res.body).to.have.property('1').to.have.property(`${i}`).to.have.property('reading').to.be.closeTo(Number(expected[i][0]), delta);
		//TODO need to figure out a general way to find the start timestamp
		expect(res.body).to.have.property('1').to.have.property(`${i}`).to.have.property('endTimestamp').to.equal(Date.parse(expected[i][2]));
	}
}
// TODO 
// Test readings from meters at different rates (15 min, 23 min)
// Test groups as well
// Optimize testing to run faster, each test is taking ~4 seconds which is way too slow on M1 Macbook

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.beforeEach(async () => {
			await recreateDB();
		});
		mocha.describe('for line charts', () => {
			mocha.describe('for meters', () => {
				// A reading response should have a reading, startTimestamp, and endTimestamp key
  				mocha.it('response should have valid reading and timestamps,', async () => {
					const unitDataOne = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'];
					const unitDataTwo = ['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 	'special unit'];
					const conversionData = ['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'];
					const meterData = ['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
					'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];

					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterData);
					const res = await chai.request(app).get('/api/unitReadings/line/meters/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					// unitReadings should be returning json 
					expect(res).to.be.json;
					// the route should not return a bad request
					expect(res).to.have.status(HTTP_CODE.OK);
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('endTimestamp');
				}); 
				mocha.it('should have the expected readings for 15 minute reading intervals and quantity units', async () => {
					const unitDataOne = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT,
						'', Unit.displayableType.ALL, true, 'OED created standard unit'];
					const unitDataTwo = ['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER,
						'', Unit.displayableType.NONE, false, 'special unit'];
					const conversionData = ['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'];
					const meterData = ['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];

					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterData);
					let expected = 
						await parseExpectedCsv('src/server/test/web/readingsData/expected_ri_15_unit_kWh_st_-inf_et_inf.csv');

					const res = await chai.request(app).get('/api/unitReadings/line/meters/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expectReadingToEqualExpected(res, expected);
				});
				mocha.it('should have the expected readings for 15 minute reading intervals and flow units', async () => {
					const unitDataOne = ['kW', '', Unit.unitRepresentType.FLOW, 3600, Unit.unitType.UNIT,
					'', Unit.displayableType.ALL, true, 'kilowatts'];
					const unitDataTwo = ['Electric', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER,
						'', Unit.displayableType.NONE, false, 'special unit'];
					const conversionData = ['Electric', 'kW', false, 1, 0, 'Electric → kW'];
					const meterData = ['Electric kW', 'Electric', 'kW', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];

					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterData);
					let expected = 
						await parseExpectedCsv('src/server/test/web/readingsData/expected_ri_15_unit_kWh_st_-inf_et_inf.csv');

					const res = await chai.request(app).get('/api/unitReadings/line/meters/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expectReadingToEqualExpected(res, expected);
					
				});
				mocha.it('should have the expected readings for 15 minute reading intervals and raw units', async () => {
					const unitDataOne = ['c', '', Unit.unitRepresentType.RAW, 3600, Unit.unitType.UNIT,
					'', Unit.displayableType.ALL, true, 'Celsius'];
					const unitDataTwo = ['Degrees', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER,
						'', Unit.displayableType.NONE, false, 'special unit'];
					const conversionData = ['Degrees', 'c', false, 1, 0, 'Degrees → c'];
					const meterData = ['Degrees Celsius', 'Degrees', 'c', true, undefined,
						'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];

					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterData);
					let expected = 
						await parseExpectedCsv('src/server/test/web/readingsData/expected_ri_15_unit_kWh_st_-inf_et_inf.csv');

					const res = await chai.request(app).get('/api/unitReadings/line/meters/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('should return an empty json object for an invalid unit', async () => {
					const unitDataOne = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT,
						'', Unit.displayableType.ALL, true, 'OED created standard unit'];
					const unitDataTwo = ['invalidUnit', '', Unit.unitRepresentType.UNUSED, 1, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'Invalid Unit'];
					const conversionData = ['invalidUnit', 'kWh', false, 1, 0, 'invalidUnit → kWh'];
					const meterData = ['Invalid', 'invalidUnit', 'kWh', true, undefined, 
						'invalid meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];

					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterData);
					const res = await chai.request(app).get('/api/unitReadings/line/meters/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expect(res).to.be.json;
					expect(res.body).to.have.property('1').to.be.empty;

				}); 
			});
			mocha.describe('for groups', () => {
				// A reading response should have a reading, startTimestamp, and endTimestamp key
				mocha.it('response should have valid reading and timestamps,', async () => {
					const unitDataOne = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'];
					const unitDataTwo = ['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 	'special unit'];
					const conversionData = ['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'];
					const meterDataOne = ['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
					'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];
					const meterDataTwo = ['Electric Utility kWh 2-6', 'Electric_Utility', 'kWh', true, undefined, 'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];
					const groupData = ['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []];
					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterDataOne, meterDataTwo, groupData);
					const res = await chai.request(app).get('/api/unitReadings/line/groups/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					// unitReadings should be returning json 
					expect(res).to.be.json;
					// the route should not return a bad request
					expect(res).to.have.status(HTTP_CODE.OK);
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('endTimestamp');
				});
			});
		});
		
  		mocha.describe('for bar charts', () => {
			// The logic here is effectively the same as the line charts, however bar charts have an added
			// barWidthDays parameter that must be accounted for, which adds a few extra steps
			mocha.describe('for meters', () => {
				mocha.it('response should have a valid reading, startTimestamp, and endTimestamp', async () => {
					const unitDataOne = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'];
					const unitDataTwo = ['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 	'special unit'];
					const conversionData = ['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'];
					const meterDataOne = ['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
					'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];
					const meterDataTwo = ['Electric Utility kWh 2-6', 'Electric_Utility', 'kWh', true, undefined, 'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];
					const groupData = ['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []];
					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterDataOne, meterDataTwo, groupData);
					const res = await chai.request(app).get('/api/unitReadings/bar/meters/1')
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: 1
						});
					expect(res).to.be.json;
					expect(res).to.have.status(HTTP_CODE.OK);
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('endTimestamp');
				});
			});
			mocha.describe('for groups', () => {
				mocha.it('response should have a valid reading, startTimestamp, and endTimestamp', async () => {
					const unitDataOne = ['kWh', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, 'OED created standard unit'];
					const unitDataTwo = ['Electric_Utility', '', Unit.unitRepresentType.QUANTITY, 3600, Unit.unitType.METER, '', Unit.displayableType.NONE, false, 	'special unit'];
					const conversionData = ['Electric_Utility', 'kWh', false, 1, 0, 'Electric_Utility → kWh'];
					const meterDataOne = ['Electric Utility kWh', 'Electric_Utility', 'kWh', true, undefined,
					'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];
					const meterDataTwo = ['Electric Utility kWh 2-6', 'Electric_Utility', 'kWh', true, undefined, 'special meter', 'test/web/readingsData/readings_ri_15_days_75.csv', false];
					const groupData = ['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], []];
					await prepareTest(unitDataOne, unitDataTwo, conversionData, meterDataOne, meterDataTwo, groupData);
					const res = await chai.request(app).get('/api/unitReadings/bar/groups/1')
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: 1
						});
					expect(res).to.be.json;
					expect(res).to.not.status(HTTP_CODE.OK);
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property('1').to.have.property('0').to.have.property('endTimestamp');
				});
			})
		});
	});
	mocha.describe('rejection tests, test behavior with invalid api calls', () => {
		mocha.describe('for line charts', () => {
			mocha.describe('for meters', () => {
				// A request is required to have both timeInterval and graphicUnitId as parameters
				mocha.it('rejects requests without a timeInterval or graphicUnitId', async () => {
					const res = await chai.request(app).get('/api/unitReadings/line/meters/1');
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have timeInterval', async () => {
					const res = await chai.request(app).get('/api/unitReadings/line/meters/1')
						.query({ graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get('/api/unitReadings/line/meters/1')
						.query({ timeInterval: ETERNITY.toString() });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
			});
			mocha.describe('for groups', () => {
				// A request is required to have both timeInterval and graphicUnitId as parameters
				mocha.it('rejects requests without a timeInterval or graphicUnitId', async () => {
					const res = await chai.request(app).get('/api/unitReadings/line/groups/1');
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have timeInterval', async () => {
					const res = await chai.request(app).get('/api/unitReadings/line/groups/1')
						.query({ graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get('/api/unitReadings/line/groups/1')
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
					const res = await chai.request(app).get('/api/unitReadings/bar/meters/1');
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a barWidthDays', async () => {
					const res = await chai.request(app).get('/api/unitReadings/bar/meters/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a timeInterval', async () => {
					const res = await chai.request(app).get('/api/unitReadings/bar/meters/1')
						.query({ barWidthDays: 1, graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get('/api/unitReadings/bar/meters/1')
						.query({ timeInterval: ETERNITY.toString(), barWidthDays: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
			});
			mocha.describe('for groups', () => {
				mocha.it('rejects requests without a timeInterval or barWidthDays or graphicUnitId', async () => {
					const res = await chai.request(app).get('/api/unitReadings/bar/groups/1');
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a barWidthDays', async () => {
					const res = await chai.request(app).get('/api/unitReadings/bar/groups/1')
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a timeInterval', async () => {
					const res = await chai.request(app).get('/api/unitReadings/bar/groups/1')
						.query({ barWidthDays: 1, graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get('/api/unitReadings/bar/groups/1')
						.query({ timeInterval: ETERNITY.toString(), barWidthDays: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
			});
		});
	});
});