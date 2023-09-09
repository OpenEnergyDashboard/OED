/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
	This file tests the 3D readings retrieval API.

	see: https://github.com/OpenEnergyDashboard/DevDocs/blob/main/testing/testing.md for information on loading readings test data

	Directions for creating reading tests (not needed for rejection tests)
		1) define arrays of data for units, conversions, a test meter using testing csv (optionally a second test meter and group for group testing)
		2) load these arrays by invoking prepareTest(* defined data arrays *)
		3) create an array of values using the expected values csv by calling parseExpectedCsv on the file and assigning the return value
		4) write your test using expectThreeDReadingToEqualExpected to check the values and createTimeString
*/

const { chai, mocha, expect, app } = require('../common');
const { prepareTest,
	parseExpectedCsv,
	expectThreeDReadingToEqualExpected,
	createTimeString,
	getUnitId,
	ETERNITY,
	METER_ID,
	GROUP_ID,
	HTTP_CODE,
	unitDatakWh,
	conversionDatakWh } = require('../../util/readingsUtils');
const Unit = require('../../models/Unit');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for threeD graphs', () => {
			mocha.describe('for meters', () => {
				mocha.it('response should be invalid if unbounded time', async () => {
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
					// Hours per reading returned.
					const timePerReading = 1;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId, readingInterval: timePerReading });
					// the route should return a bad request
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('response should be invalid if just over 1 year time', async () => {
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
					// Hours per reading returned.
					const timePerReading = 1;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-02', '00:00:00'), graphicUnitId: unitId, readingInterval: timePerReading });
					// the route should return a bad request
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('response should be valid if just 1 year time', async () => {
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
					// Hours per reading returned.
					const timePerReading = 1;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-01', '00:00:00'), graphicUnitId: unitId, readingInterval: timePerReading });
					// unitReadings should return as json
					expect(res).to.be.json;
					// the route should return an ok request
					expect(res).to.have.status(HTTP_CODE.OK);
					// Check if has the expected properties.
					expect(res.body).to.have.property('xData');
					expect(res.body).to.have.property('yData');
					expect(res.body).to.have.property('zData');
				});
				// Test all the allowed hours per reading which are the divisors of 24 but not 24.
				const allowedTimePerReading = [1, 2, 3, 4, 6, 8, 12];
				for (let currentTimePerReadingIndex = 0; currentTimePerReadingIndex < allowedTimePerReading.length; currentTimePerReadingIndex++) {
					const currentTimePerReading = allowedTimePerReading[currentTimePerReadingIndex];
					mocha.it(`15 minute readings, ${currentTimePerReading} point/day, full time range and quantity units of kWh as kWh`, async () => {
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
						const expected = await parseExpectedCsv(
							`src/server/test/web/readingsData/expected_3d_hp_${currentTimePerReading}_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
						// Create a request to the API and save the response
						const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
							.query({
								timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
								graphicUnitId: unitId, readingInterval: currentTimePerReading
							});
						expectThreeDReadingToEqualExpected(res, expected, currentTimePerReading);
					});
				}
				mocha.it('15 minute readings, 8 readings/day, partial time range and quantity units of kWh as kWh', async () => {
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
					// Hours per reading returned.
					const timePerReading = 3;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_hp_3_ri_15_mu_kWh_gu_kWh_st_2022-09-19%00#00#00_et_2022-09-23%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							// Should not do a day that is almost full.
							timeInterval: createTimeString('2022-09-18', '00:00:01', '2022-09-23', '23:59:59'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it('15 minute readings, 8 readings/day, less than 1 day and quantity units of kWh as kWh', async () => {
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
					// Hours per reading returned.
					const timePerReading = 3;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							// Should not do a day that is almost full.
							timeInterval: createTimeString('2022-09-13', '00:00:01', '2022-09-14', '23:59:59'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					// expectThreeDReadingToEqualExpected not designed to handle no return data so test this specially.
					expect(res).to.be.json;
					expect(res).to.have.status(HTTP_CODE.OK);
					// Did the response have the correct type of properties.
					expect(res.body).to.have.property('xData');
					expect(res.body).to.have.property('yData');
					// The lengths should be correct.
					expect(res.body, 'xData length').to.have.property(`xData`).to.have.lengthOf(0);
					expect(res.body, 'yData length').to.have.property(`yData`).to.have.lengthOf(0);
					expect(res.body, 'zData length').to.have.property(`zData`).to.have.lengthOf(0);
				});
				mocha.it('15 minute readings, 6 readings/day, full time range and quantity units of kWh as BTU', async () => {
					const unitData = unitDatakWh.concat([
						{
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
							sourceName: 'kWh',
							destinationName: 'MJ',
							bidirectional: true,
							slope: 3.6,
							intercept: 0,
							note: 'kWh → MJ'
						},
						{
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
					// Hours per reading returned.
					const timePerReading = 4;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_hp_4_ri_15_mu_kWh_gu_BTU_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							// Should not do a day that is almost full.
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it('15 minute readings, 6 readings/day, full time range and flow units of kW as kW', async () => {
					const unitData = [
						{
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
					// Hours per reading returned.
					const timePerReading = 4;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_hp_4_ri_15_mu_kW_gu_kW_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it('15 minute readings, 6 readings/day, full time range and raw units of Celsius as Celsius', async () => {
					const unitData = [
						{
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
					// Hours per reading returned.
					const timePerReading = 4;
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_hp_4_ri_15_mu_kW_gu_kW_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it(`4 hour readings, 8 point/day returns 6, full time range and quantity units of kWh as kWh`, async () => {
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
							// Make it 4 hours but ok since using hour table.
							readingFrequency: '4 hours',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load and parse the corresponding expected values from csv. 4 hours not 3.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_hp_4_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: 3
						});
					expectThreeDReadingToEqualExpected(res, expected, 4);
				});
				mocha.it(`12.5 hour readings, 2 point/day gives none, full time range and quantity units of kWh as kWh`, async () => {
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
							// Make it a little too big..
							readingFrequency: '12.5 hours',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load and parse the corresponding expected values from csv. 4 hours not 3.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_meterFrequencyTooLong.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: 12
						});
					// Use 24 for timePerReading since unusual return data.
					expectThreeDReadingToEqualExpected(res, expected, 24, true);
				});
				mocha.it('15 minute readings, 3 readings/day with holes, extended time range and quantity units of kWh as kWh', async () => {
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
							file: 'test/web/readingsData/readings_ri_15_days_75_holes.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Hours per reading returned.
					const timePerReading = 8;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_hp_8_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00_holes.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({
							// Going beyond dates to show no return for those.
							timeInterval: createTimeString('2022-08-03', '00:00:00', '2022-11-11', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
			});
			mocha.describe('for groups', () => {
				mocha.it('response should be invalid if unbounded time', async () => {
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
							name: 'Electric Utility Other',
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
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Hours per reading returned.
					const timePerReading = 1;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId, readingInterval: timePerReading });
					// the route should return a bad request
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('response should be invalid if just over 1 year time', async () => {
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
							name: 'Electric Utility Other',
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
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Hours per reading returned.
					const timePerReading = 1;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({ timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-02', '00:00:00'), graphicUnitId: unitId, readingInterval: timePerReading });
					// the route should return a bad request
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('response should be valid if just 1 year time', async () => {
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
							name: 'Electric Utility Other',
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
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Hours per reading returned.
					const timePerReading = 1;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({ timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-01', '00:00:00'), graphicUnitId: unitId, readingInterval: timePerReading });
					// unitReadings should return as json
					expect(res).to.be.json;
					// the route should return an ok request
					expect(res).to.have.status(HTTP_CODE.OK);
					// Check if has the expected properties.
					expect(res.body).to.have.property('xData');
					expect(res.body).to.have.property('yData');
					expect(res.body).to.have.property('zData');
				});
				// Test all the allowed hours per reading which are the divisors of 24 but not 24.
				const allowedTimePerReading = [1, 2, 3, 4, 6, 8, 12];
				for (let currentTimePerReadingIndex = 0; currentTimePerReadingIndex < allowedTimePerReading.length; currentTimePerReadingIndex++) {
					const currentTimePerReading = allowedTimePerReading[currentTimePerReadingIndex];
					mocha.it(`15 + 20 readings, ${currentTimePerReading} point/day, full time range and quantity units of kWh as kWh`, async () => {
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
								name: 'Electric Utility Other',
								unit: 'Electric_Utility',
								defaultGraphicUnit: 'kWh',
								displayable: true,
								gps: undefined,
								note: 'special meter',
								file: 'test/web/readingsData/readings_ri_20_days_75.csv',
								deleteFile: false,
								readingFrequency: '20 minutes',
								id: (METER_ID + 1)
							}
						];
						const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
						// Load the data into the database
						await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
						// Get the unit ID since the DB could use any value.
						const unitId = await getUnitId('kWh');
						// Load and parse the corresponding expected values from csv
						const expected = await parseExpectedCsv(
							`src/server/test/web/readingsData/expected_3d_group_hp_${currentTimePerReading}_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
						// Create a request to the API and save the response
						const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
							.query({
								timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
								graphicUnitId: unitId, readingInterval: currentTimePerReading
							});
						expectThreeDReadingToEqualExpected(res, expected, currentTimePerReading);
					});
				}
				mocha.it('15 minute readings, 8 readings/day, partial time range and quantity units of kWh as kWh', async () => {
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
							name: 'Electric Utility Other',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							readingFrequency: '20 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Hours per reading returned.
					const timePerReading = 3;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_group_hp_3_ri_15_mu_kWh_gu_kWh_st_2022-09-19%00#00#00_et_2022-09-23%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							// Should not do a day that is almost full.
							timeInterval: createTimeString('2022-09-18', '00:00:01', '2022-09-23', '23:59:59'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it('15 minute readings, 8 readings/day, less than 1 day and quantity units of kWh as kWh', async () => {
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
							name: 'Electric Utility Other',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							readingFrequency: '20 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Hours per reading returned.
					const timePerReading = 3;
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							// Should not do a day that is almost full.
							timeInterval: createTimeString('2022-09-13', '00:00:01', '2022-09-14', '23:59:59'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					// expectThreeDReadingToEqualExpected not designed to handle no return data so test this specially.
					expect(res).to.be.json;
					expect(res).to.have.status(HTTP_CODE.OK);
					// Did the response have the correct type of properties.
					expect(res.body).to.have.property('xData');
					expect(res.body).to.have.property('yData');
					// The lengths should be correct.
					expect(res.body, 'xData length').to.have.property(`xData`).to.have.lengthOf(0);
					expect(res.body, 'yData length').to.have.property(`yData`).to.have.lengthOf(0);
					expect(res.body, 'zData length').to.have.property(`zData`).to.have.lengthOf(0);
				});
				mocha.it('15 minute readings, 6 readings/day, full time range and quantity units of kWh as BTU', async () => {
					const unitData = unitDatakWh.concat([
						{
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
							sourceName: 'kWh',
							destinationName: 'MJ',
							bidirectional: true,
							slope: 3.6,
							intercept: 0,
							note: 'kWh → MJ'
						},
						{
							sourceName: 'MJ',
							destinationName: 'BTU',
							bidirectional: true,
							slope: 947.8,
							intercept: 0,
							note: 'MJ → BTU'
						}
					]);
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
							name: 'Electric Utility Other',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							readingFrequency: '20 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitData, conversionData, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('BTU');
					// Hours per reading returned.
					const timePerReading = 4;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_group_hp_4_ri_15_mu_kWh_gu_BTU_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it('15 minute readings, 6 readings/day, full time range and flow units of kW as kW', async () => {
					const unitData = [
						{
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
						},
						{
							name: 'Electric kW Other',
							unit: 'Electric',
							defaultGraphicUnit: 'kW',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							readingFrequency: '20 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric both', 'kW', true, undefined, 'special group', ['Electric kW', 'Electric kW Other'], [], GROUP_ID]];
					await prepareTest(unitData, conversionData, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kW');
					// Hours per reading returned.
					const timePerReading = 4;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_group_hp_4_ri_15_mu_kW_gu_kW_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it('15 minute readings, 6 readings/day, full time range and raw units of Celsius as Celsius', async () => {
					const unitData = [
						{
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
							name: 'Temperature C',
							unit: 'Degrees',
							defaultGraphicUnit: 'C',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_15_days_75.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						},
						{
							name: 'Temperature C Other',
							unit: 'Degrees',
							defaultGraphicUnit: 'C',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							readingFrequency: '20 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Temperature both', 'C', true, undefined, 'special group', ['Temperature C', 'Temperature C Other'], [], GROUP_ID]];
					await prepareTest(unitData, conversionData, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('C');
					// Hours per reading returned.
					const timePerReading = 4;
					// Reuse same file as flow since value should be the same values.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_group_hp_4_ri_15_mu_kW_gu_kW_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
				mocha.it(`4 & 6 hour readings, 8 point/day returns 6, full time range and quantity units of kWh as kWh`, async () => {
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
							// Make it 4 hours but ok since using hour table.
							readingFrequency: '4 hours',
							id: METER_ID
						},
						{
							name: 'Electric Utility Other',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							// Make it 6 hours but ok since using hour table.
							readingFrequency: '6 hours',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load and parse the corresponding expected values from csv. 4 hours not 3.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_group_hp_4_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: 3
						});
					expectThreeDReadingToEqualExpected(res, expected, 4);
				});
				mocha.it(`12.5 hour readings, 2 point/day returns none, full time range and quantity units of kWh as kWh`, async () => {
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
							// Make it a way too big.
							readingFrequency: '4 days',
							id: METER_ID
						},
						{
							name: 'Electric Utility Other',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							// Make it a little too big.
							readingFrequency: '12.5 hours',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load and parse the corresponding expected values from csv. 4 hours not 3.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_groupFrequencyTooLong.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
							graphicUnitId: unitId, readingInterval: 12
						});
					// Use 24 for timePerReading since unusual return data.
					expectThreeDReadingToEqualExpected(res, expected, 24, true);
				});
				mocha.it('15 minute readings, 3 readings/day with holes, extended time range and quantity units of kWh as kWh', async () => {
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
							file: 'test/web/readingsData/readings_ri_15_days_75_holes.csv',
							deleteFile: false,
							readingFrequency: '15 minutes',
							id: METER_ID
						},
						{
							name: 'Electric Utility Other',
							unit: 'Electric_Utility',
							defaultGraphicUnit: 'kWh',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75_holes.csv',
							deleteFile: false,
							readingFrequency: '20 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupData = [['Electric Utility kWh + Other', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility Other'], [], GROUP_ID]];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Hours per reading returned.
					const timePerReading = 8;
					// Load and parse the corresponding expected values from csv.
					const expected = await parseExpectedCsv(
						`src/server/test/web/readingsData/expected_3d_group_hp_8_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00_holes.csv`);
					// Create a request to the API and save the response
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({
							// Going beyond dates to show no return for those.
							timeInterval: createTimeString('2022-08-03', '00:00:00', '2022-11-11', '00:00:00'),
							graphicUnitId: unitId, readingInterval: timePerReading
						});
					expectThreeDReadingToEqualExpected(res, expected, timePerReading);
				});
			});
		});
	});
	// These tests check the API behavior when improper calls are made, typically with incomplete parameters
	// The API should return status code 400 regardless of what is in the database, so no data is loaded.
	mocha.describe('rejection tests, test behavior with invalid api calls', () => {
		mocha.describe('for threeD graphs', () => {
			// A sampling of bad values which are not divisors of 24 <= 12.
			const disallowedTimePerReading = [5, 7, 9, 11, 13, 24, 101];
			mocha.describe('for meters', () => {
				mocha.it('rejects requests without a timeInterval or readingInterval or graphicUnitId', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`);
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a timeInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({ graphicUnitId: 1, readingInterval: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), readingInterval: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have readingInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				for (let currentTimePerReadingIndex = 0; currentTimePerReadingIndex < disallowedTimePerReading.length; currentTimePerReadingIndex++) {
					const currentTimePerReading = disallowedTimePerReading[currentTimePerReadingIndex];
					mocha.it(`reject if request has bad readingInterval of ${currentTimePerReading}`, async () => {
						const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
							.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: 1 });
						expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
					});
				}
			});
			mocha.describe('for groups', () => {
				mocha.it('rejects requests without a timeInterval or readingInterval or graphicUnitId', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`);
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a readingInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('rejects requests without a timeInterval', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({ readingInterval: 1, graphicUnitId: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				mocha.it('reject if request does not have graphicUnitID', async () => {
					const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
						.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), readingInterval: 1 });
					expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
				});
				for (let currentTimePerReadingIndex = 0; currentTimePerReadingIndex < disallowedTimePerReading.length; currentTimePerReadingIndex++) {
					const currentTimePerReading = disallowedTimePerReading[currentTimePerReadingIndex];
					mocha.it(`reject if request has bad readingInterval of ${currentTimePerReading}`, async () => {
						const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
							.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: 1 });
						expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
					});
				}
			});
		});
	});
});
