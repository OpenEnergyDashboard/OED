/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*
	This file tests the readings retrieval API.

	see: https://github.com/OpenEnergyDashboard/DevDocs/blob/main/testing/testing.md for information on loading readings test data

	Directions for creating reading tests (not needed for rejection tests)
		1) define arrays of data for units, conversions, a test meter using testing csv (optionally a second test meter and group for group testing)
		2) load these arrays by invoking prepareTest(* defined data arrays *)
		3) create an array of values using the expected values csv by calling parseExpectedCsv on the file and assigning the return value
		4) write your test using expectReadingToEqualExpected to check the values and createTimeString
*/

const { chai, mocha, expect, app } = require('../common');
const Unit = require('../../models/Unit');

const { prepareTest,
	parseExpectedCsv,
	expectReadingToEqualExpected,
	createTimeString,
	getUnitId,
	ETERNITY,
	METER_ID,
	GROUP_ID,
	HTTP_CODE,
	unitDatakWh,
	conversionDatakWh } = require('../../util/readingsUtils');

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
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
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
				mocha.it('L1: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load the expected response data from the corresponding csv file
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf.csv');
					// Create a request to the API for unbounded reading times and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					// Check that the API reading is equal to what it is expected to equal
					expectReadingToEqualExpected(res, expected);
				});
				// This test is effectively the same as the last, but we specify the date range
				// Should return daily point readings
				mocha.it('L2: should have daily points for 15 minute reading intervals and quantity units with explicit start/end time & kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load and parse the corresponding expected values from csv
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
					// Create a request to the API for the date range specified using createTimeString and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected);
				});
				// This date range is on the threshold of returning daily point readings, 61 days
				mocha.it('L3: should have daily points for middle readings of 15 minute for a 61 day period and quantity units with kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-25%00#00#00.csv');
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-25', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected);
				});
				mocha.it('L4: should have hourly points for middle readings of 15 minute for a 60 day period and quantity units with kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected);
				});
				mocha.it('L5: should barely have hourly points for middle readings of 15 minute for a 15 day + 15 min period and quantity units with kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-09-21%00#00#00_et_2022-10-06%00#00#00.csv');
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-06', '00:15:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected);
				});
				// 14 days barely gives raw points & middle readings
				mocha.it('L6: 14 days barely gives raw points & middle readings', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-09-21%00#00#00_et_2022-10-05%00#00#00.csv');
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-05', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected);
				});

				// Add L7 here

				// Test 15 minutes over all time for flow unit.
				mocha.it('L8: should have daily points for 15 minute reading intervals and flow units with +-inf start/end time & kW as kW', async () => {
					const unitData = [
						{
							// u4
							name: 'kW',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.FLOW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'kilowatts'
						},
						{
							// u5
							name: 'Electric',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.FLOW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						}
					];
					const conversionData = [
						{
							// c4
							sourceName: 'Electric',
							destinationName: 'kW',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Electric → kW'
						}
					];
					const meterData = [
						{
							name: 'Electric kW',
							unit: 'Electric',
							defaultGraphicUnit: 'kW',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kW');
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kW_gu_kW_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected);
				});
				// Test 15 minutes over all time for raw unit.
				mocha.it('L9: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & Celsius as Celsius', async () => {
					const unitData = [
						{
							// u6
							name: 'C',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Celsius'
						},
						{
							// u7
							name: 'Degrees',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						}
					];
					const conversionData = [
						{
							// c5
							sourceName: 'Degrees',
							destinationName: 'C',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Degrees → C'
						}
					];
					const meterData = [
						{
							name: 'Degrees Celsius',
							unit: 'Degrees',
							defaultGraphicUnit: 'C',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('C');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kW_gu_kW_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L10: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as MJ', async () => {
					const unitData = unitDatakWh.concat([
						{
							// u3
							name: 'MJ',
							identifier: 'megaJoules',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'MJ'
						}
					]);
					const conversionData = conversionDatakWh.concat([
						{
							// c2
							sourceName: 'kWh',
							destinationName: 'MJ',
							bidirectional: true,
							slope: 3.6,
							intercept: 0,
							note: 'kWh → MJ'
						}
					]);
					const meterData = [
						{
							name: 'Electric Utility MJ',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'MJ',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('MJ');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L11: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as MJ reverse conversion', async () => {
					const unitData = unitDatakWh.concat([
						{
							// u3
							name: 'MJ',
							identifier: 'megaJoules',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'MJ'
						}
					]);
					const conversionData = conversionDatakWh.concat([
						{
							// c6
							sourceName: 'MJ',
							destinationName: 'kWh',
							bidirectional: true,
							slope: 1 / 3.6,
							intercept: 0,
							note: 'MJ → KWh'
						}
					]);
					const meterData = [
						{
							name: 'Electric Utility MJ',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'MJ',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('MJ');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L12: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as BTU chained', async () => {
					const unitData = unitDatakWh.concat([
						{
							// u3
							name: 'MJ',
							identifier: 'megaJoules',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'MJ'
						},
						{
							// u16
							name: 'BTU',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'special unit'
						}
					]);
					const conversionData = conversionDatakWh.concat([
						{
							// c2
							sourceName: 'kWh',
							destinationName: 'MJ',
							bidirectional: true,
							slope: 3.6,
							intercept: 0,
							note: 'kWh → MJ'
						},
						{
							// c3
							sourceName: 'MJ',
							destinationName: 'BTU',
							bidirectional: true,
							slope: 947.8,
							intercept: 0,
							note: 'MJ → BTU'
						}
					]);
					const meterData = [
						{
							name: 'Electric_Utility BTU',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'BTU',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('BTU');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_BTU_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});

				mocha.it('L13: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as BTU chained with reverse conversion', async () => {
					const unitData = unitDatakWh.concat([
						{
							// u3
							name: 'MJ',
							identifier: 'megaJoules',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'MJ'
						},
						{
							// u16
							name: 'BTU',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'OED created standard unit'
						}
					]);
					const conversionData = conversionDatakWh.concat([
						{
							// c3
							sourceName: 'MJ',
							destinationName: 'BTU',
							bidirectional: true,
							slope: 947.8,
							intercept: 0,
							note: 'MJ → BTU'
						},
						{
							// c6
							sourceName: 'MJ',
							destinationName: 'kWh',
							bidirectional: true,
							slope: 1 / 3.6,
							intercept: 0,
							note: 'MJ → KWh'
						}
					]);
					const meterData = [
						{
							name: 'Electric_Utility BTU',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'BTU',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('BTU');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_BTU_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L14: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as F with intercept', async () => {
					const unitData = [
						{
							// u6
							name: 'C',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Celsius'
						},
						{
							// u7
							name: 'Degrees',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u8
							name: 'F',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						}
					];
					const conversionData = [
						{
							// c5
							sourceName: 'Degrees',
							destinationName: 'C',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Degrees → C'
						},
						{
							// c7
							sourceName: 'C',
							destinationName: 'F',
							bidirectional: true,
							slope: 1.8,
							intercept: 32,
							note: 'Celsius → Fahrenheit'
						}
					];
					const meterData = [
						{
							name: 'Degrees F',
							unit: 'Degrees',
							defaultGraphicUnit: 'F',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('F');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L15: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as F with intercept reverse conversion', async () => {
					const unitData = [
						{
							// u6
							name: 'C',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Celsius'
						},
						{
							// u7
							name: 'Degrees',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u8
							name: 'F',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						}
					];
					const conversionData = [
						{
							// c5
							sourceName: 'Degrees',
							destinationName: 'C',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Degrees → C'
						},
						{
							// c8
							sourceName: 'F',
							destinationName: 'C',
							bidirectional: true,
							slope: 1 / 1.8,
							intercept: -32 / 1.8,
							note: 'Fahrenheit → Celsius'
						}
					];
					const meterData = [
						{
							name: 'Degrees F',
							unit: 'Degrees',
							defaultGraphicUnit: 'F',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('F');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L16: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as Widget with intercept & chained', async () => {
					const unitData = [
						{
							// u6
							name: 'C',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Celsius'
						},
						{
							// u7
							name: 'Degrees',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u8
							name: 'F',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						},
						{
							// u9
							name: 'Widget',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'fake unit'
						}
					];
					const conversionData = [
						{
							// c5
							sourceName: 'Degrees',
							destinationName: 'C',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Degrees → C'
						},
						{
							// c7
							sourceName: 'C',
							destinationName: 'F',
							bidirectional: true,
							slope: 1.8,
							intercept: 32,
							note: 'Celsius → Fahrenheit'
						},
						{
							// c9
							sourceName: 'F',
							destinationName: 'Widget',
							bidirectional: true,
							slope: 5,
							intercept: 3,
							note: 'Fahrenheit → Widget'
						}
					];
					const meterData = [
						{
							name: 'Degrees Widget',
							unit: 'Degrees',
							defaultGraphicUnit: 'Widget',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('Widget');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_Widget_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L17: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as Widget with intercept & chained & reverse conversions', async () => {
					const unitData = [
						{
							// u6
							name: 'C',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Celsius'
						},
						{
							// u7
							name: 'Degrees',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u8
							name: 'F',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						},
						{
							// u9
							name: 'Widget',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'fake unit'
						}
					];
					const conversionData = [
						{
							// c5
							sourceName: 'Degrees',
							destinationName: 'C',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Degrees → C'
						},
						{
							// c8
							sourceName: 'F',
							destinationName: 'C',
							bidirectional: true,
							slope: 1 / 1.8,
							intercept: -32 / 1.8,
							note: 'Fahrenheit → Celsius'
						},
						{
							// c10
							sourceName: 'Widget',
							destinationName: 'F',
							bidirectional: true,
							slope: 0.2,
							intercept: -3 / 5,
							note: 'Fahrenheit → Widget'
						}
					];
					const meterData = [
						{
							name: 'Degrees Widget',
							unit: 'Degrees',
							defaultGraphicUnit: 'Widget',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('Widget');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_Widget_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});

				// Add L18 here

				mocha.it('L19: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as metric ton of CO2 & chained', async () => {
					const unitData = [
						{
							// u2 - add by self since not want kWh
							name: 'Electric_Utility',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u10
							name: 'kg',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						},
						{
							// u11
							name: 'metric ton',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						},
						{
							// u12
							name: 'kg CO₂',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: 'CO₂',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'special unit'
						}
					];
					const conversionData = [
						{
							// c11
							sourceName: 'Electric_Utility',
							destinationName: 'kg CO₂',
							bidirectional: false,
							slope: 0.709,
							intercept: 0,
							note: 'Electric_Utility → kg CO₂'
						},
						{
							// c12
							sourceName: 'kg CO₂',
							destinationName: 'kg',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'CO₂ → kg'
						},
						{
							// c13
							sourceName: 'kg',
							destinationName: 'metric ton',
							bidirectional: true,
							slope: 1e-3,
							intercept: 0,
							note: 'kg → Metric ton'
						}
					];
					const meterData = [
						{
							name: 'Electric_Utility metric ton of CO₂',
							unit: 'Electric_Utility',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('metric ton of CO₂');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MTonCO2_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});

				// Add L20 here

				mocha.it('L21: should have hourly points for middle readings of 15 minute for a 60 day period and quantity units & kWh as MJ', async () => {
					const unitData = unitDatakWh.concat([
						{
							// u3
							name: 'MJ',
							identifier: 'megaJoules',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'MJ'
						}
					]);
					const conversionData = conversionDatakWh.concat([
						{
							// c2
							sourceName: 'kWh',
							destinationName: 'MJ',
							bidirectional: true,
							slope: 3.6,
							intercept: 0,
							note: 'kWh → MJ'
						}
					]);
					const meterData = [
						{
							name: 'Electric_Utility MJ',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'MJ',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('MJ');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L22: should have hourly points for middle readings of 15 minute for a 60 day period and raw units & C as F with intercept', async () => {
					const unitData = [
						{
							// u6
							name: 'C',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Celsius'
						},
						{
							// u7
							name: 'Degrees',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u8
							name: 'F',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						}
					];
					const conversionData = [
						{
							// c5
							sourceName: 'Degrees',
							destinationName: 'C',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Degrees → C'
						},
						{
							// c7
							sourceName: 'C',
							destinationName: 'F',
							bidirectional: true,
							slope: 1.8,
							intercept: 32,
							note: 'Celsius → Fahrenheit'
						}
					];
					const meterData = [
						{
							name: 'Degrees F',
							unit: 'Degrees',
							defaultGraphicUnit: 'F',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('F');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L23: should have raw points for middle readings of 15 minute for a 14 day period and quantity units & kWh as MJ', async () => {
					const unitData = unitDatakWh.concat([
						{
							// u3
							name: 'MJ',
							identifier: 'megaJoules',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'MJ'
						}
					]);
					const conversionData = conversionDatakWh.concat([
						{
							// c2
							sourceName: 'kWh',
							destinationName: 'MJ',
							bidirectional: true,
							slope: 3.6,
							intercept: 0,
							note: 'kWh → MJ'
						}
					]);
					const meterData = [
						{
							name: 'Electric_Utility MJ',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'MJ',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('MJ');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_2022-09-21%00#00#00_et_2022-10-05%00#00#00.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-05', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L24: should have raw points for middle readings of 15 minute for a 14 day period and raw units & C as F with intercept', async () => {
					const unitData = [
						{
							// u6
							name: 'C',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Celsius'
						},
						{
							// u7
							name: 'Degrees',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u8
							name: 'F',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.RAW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'OED created standard unit'
						}
					];
					const conversionData = [
						{
							// c5
							sourceName: 'Degrees',
							destinationName: 'C',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Degrees → C'
						},
						{
							// c7
							sourceName: 'C',
							destinationName: 'F',
							bidirectional: true,
							slope: 1.8,
							intercept: 32,
							note: 'Celsius → Fahrenheit'
						}
					];
					const meterData = [
						{
							name: 'Degrees F',
							unit: 'Degrees',
							defaultGraphicUnit: 'F',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('F');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_2022-09-21%00#00#00_et_2022-10-05%00#00#00.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-05', '00:00:00'), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				mocha.it('L25: should have daily points for 15 minute reading intervals and flow units with +-inf start/end time & thing as thing where rate is 36', async () => {
					const unitData = [
						{
							// u14
							name: 'Thing_36',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.FLOW,
							secInRate: 36,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
						{
							// u15
							name: 'thing unit',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.FLOW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'special unit'
						}
					];
					const conversionData = [
						{
							// c15
							sourceName: 'Thing_36',
							destinationName: 'thing unit',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'Thing_36 → thing unit'
						}
					];
					const meterData = [
						{
							name: 'Thing_36 thing unit',
							unit: 'Thing_36',
							defaultGraphicUnit: 'thing unit',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];

					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('thing unit');
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_Thing36_gu_thing_st_-inf_et_inf.csv');

					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expectReadingToEqualExpected(res, expected)
				});
				// When an invalid unit is added to a meter and loaded to the db, the API should return an empty array
				mocha.it('should return an empty json object for an invalid unit', async () => {
					const unitData = [
						{
							// u1 - do separately since don't want Electric Utility.
							name: 'kWh',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'OED created standard unit'
						},
						{
							name: 'invalidUnit',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 1,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: true,
							note: 'Invalid Unit'
						}
					];
					const conversionData = [
						{
							sourceName: 'invalidUnit',
							destinationName: 'kWh',
							bidirectional: false,
							slope: 1,
							intercept: 0,
							note: 'invalidUnit → kWh'
						}
					];
					const meterData = [
						{
							name: 'Invalid',
							unit: 'invalidUnit',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'invalid meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					expect(res).to.be.json;
					expect(res.body).to.have.property(`${METER_ID}`).to.be.empty;
				});
			});
			mocha.describe('for groups', () => {
				// A reading response should have a reading, startTimestamp, and endTimestamp key
				mocha.it('response should have valid reading and timestamps,', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						},
						{
							name: 'Electric Utility kWh 2-6',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
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
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: unitId
						});
					expect(res).to.be.json;
					expect(res).to.have.status(HTTP_CODE.OK);
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('reading');
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('startTimestamp');
					expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('endTimestamp');
				});
				mocha.it('B1: 1 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load the expected response data from the corresponding csv file
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf_bd_1.csv');
					// Create a request to the API for unbounded reading times and save the response
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: unitId
						});
					// Check that the API reading is equal to what it is expected to equal
					expectReadingToEqualExpected(res, expected);
				});
				mocha.it('B2: 7 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load the expected response data from the corresponding csv file
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf_bd_7.csv');
					// Create a request to the API for unbounded reading times and save the response
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 7,
							graphicUnitId: unitId
						});
					// Check that the API reading is equal to what it is expected to equal
					expectReadingToEqualExpected(res, expected);
				});
				mocha.it('B3: 28 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load the expected response data from the corresponding csv file
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf_bd_28.csv');
					// Create a request to the API for unbounded reading times and save the response
					const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 28,
							graphicUnitId: unitId
						});
					// Check that the API reading is equal to what it is expected to equal
					expectReadingToEqualExpected(res, expected);
				});
			});

			// Add B4 here


			// Add B5 here


			// Add B6 here

			mocha.describe('for groups', () => {
				mocha.it('response should have a valid reading, startTimestamp, and endTimestamp', async () => {
					// Create 2D array for meter to feed into the database
					// Note the meter ID is set so we know what to expect when a query is made.
					const meterData = [
						{
							name: 'Electric Utility kWh',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						},
						{
							name: 'Electric Utility kWh 2-6',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], [], GROUP_ID]];
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
						.query({
							timeInterval: ETERNITY.toString(),
							barWidthDays: 1,
							graphicUnitId: unitId
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
