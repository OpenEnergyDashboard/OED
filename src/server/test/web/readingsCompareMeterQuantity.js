/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
	This file tests the readings retrieval API compare chart meters.
	See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/
const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
	expectCompareToEqualExpected,
	getUnitId,
	METER_ID,
	unitDatakWh,
	conversionDatakWh,
	meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for compare charts', () => {
			mocha.describe('for meters', () => {
				// Test 15 minutes over all time for flow unit.
				mocha.it('C1: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [3120.01835362067, 3367.50141893133];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C2: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [7962.23097109771, 8230.447588312];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P7D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C3: 28 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [108269.924822581, 108889.847659507];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-09 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P28D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C4: 1 day shift end 2022-11-01 00:00:00 (full day) for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [4290.60000224332, 4842.21261747704];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-11-01 00:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C5: 7 day shift end 2022-11-01 15:00:00 (beyond data) for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					const unitId = await getUnitId('kWh');
					const expected = [9132.81261972035, 13147.7382388332];
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-11-01 15:00:00',
							shift: 'P7D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C6: 28 day shift end 2022-10-31 17:12:34 (partial hour) for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					const unitId = await getUnitId('kWh');
					const expected = [108269.924822581, 108889.847659507];
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-09 00:00:00',
							curr_end: '2022-10-31 17:12:34',
							shift: 'P28D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C8: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as MJ', async () => {
					// Use predefined unit and conversion data
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
						}
					]);
					// Prepare test with the standard data
					await prepareTest(unitData, conversionData, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('MJ');
					const expected = [11232.0660730344, 12123.0051081528];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C9: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as MJ reverse conversion', async () => {
					// add u3 to existing unitData
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
						}
					]);
					// add c2 to existing conversionData
					const conversionData = conversionDatakWh.concat([
						{
							sourceName: 'MJ',
							destinationName: 'kWh',
							bidirectional: true,
							slope: 1 / 3.6,
							intercept: 0,
							note: 'MJ → kWh'
						}
					]);
					await prepareTest(unitData, conversionData, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('MJ');
					const expected = [11232.0660730344, 12123.0051081528]; 
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});


				mocha.it('C10: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as BTU', async () => {
					// Use predefined unit and conversion data
					const unitData = unitDatakWh.concat([
						//adding u3, u16
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
						// adding c2, c3
						{	
							// c2
							sourceName: 'kWh',
							destinationName: 'MJ',
							bidirectional: true,
							slope: 3.6,
							intercept: 0,
							note: 'MJ → BTU'
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
					
					// load data into database
					await prepareTest(unitData, conversionData, meterDatakWh);

					// Get the unit ID since the DB could use any value
					const unitId = await getUnitId('BTU');
					const expected = [10645752.224022, 11490184.2415072];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
							});
						expectCompareToEqualExpected(res, expected);
					});

				mocha.it('C11: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as BTU reverse conversion', async () => {
					const unitData = unitDatakWh.concat([
						// adding units u3, u16
						{
							// u3
							name: 'MJ', 
							identifier: 'megaJoules', 
							unitRepresent: Unit.unitRepresentType.QUANTITY, 
							secInRate: 3600, typeOfUnit: Unit.unitType.UNIT, 
							suffix: '', displayable: Unit.displayableType.ALL, 
							preferredDisplay: false, 
							note: 'MJ'
						},
						{
							// u16
							name: 'BTU', identifier: '', 
							unitRepresent: Unit.unitRepresentType.QUANTITY, 
							secInRate: 3600, 
							typeOfUnit: Unit.unitType.UNIT, 
							suffix: '', displayable: Unit.displayableType.ALL, 
							preferredDisplay: true, 
							note: 'OED created standard unit'
						},
					]);
					const conversionData = conversionDatakWh.concat([
						// adding conversions c6, c3
						{
							// c6
							sourceName: 'MJ',
							destinationName: 'kWh',
							bidirectional: true,
							slope: 1 / 3.6,
							intercept: 0,
							note: 'MJ → KWh'
						},
						{
							// c3
							sourceName: 'MJ', 
							destinationName: 'BTU', 
							bidirectional: true, 
							slope: 947.8, 
							intercept: 0, 
							note: 'MJ → BTU' 
						},
	
					]);
					// redefining the meterData as the unit is different
					const meterData = [
						{
							name: 'Electric Utility BTU',
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
					// load data into database
					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value
					const unitId = await getUnitId('BTU');
					const expected = [10645752.224022, 11490184.2415072];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});
				mocha.it('C12: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kg of CO2', async () => {
					const unitData = [
						// adding units u2, u10, u12
						{
							//u2
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
						// adding conversions c11, c12
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
						}
					];
					const meterData = [
						{
							name: 'Electric Utility pound of CO₂',
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
					// Prepare test with the standard data
					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kg of CO₂');
					const expected = [2212.09301271706, 2387.55850602232];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
						curr_start: '2022-10-31 00:00:00',
						curr_end: '2022-10-31 17:00:00',
						shift: 'P1D',
						graphicUnitId: unitId
					});

					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C13: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as metric ton of CO2 & chained', async () => {
					// Adding units u2, u10, u11, u12
					const unitData = [
						{
							// u2
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
					// Adding conversions c11, c12, c13
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
							name: 'Electric Utility metric ton of CO₂',
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
					//load data into the database
					await prepareTest(unitData, conversionData, meterData);
					// get the unitID so for proper data retrieval
					const unitID = await getUnitId('metric ton of CO₂')
					const expected = [2.21209301271706, 2.38755850602232]
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitID
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C14: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as lbs of CO2 & chained & reversed', async () => {
					const unitData = [
						// adding units u2, u10, u11, u12, u13
						{
							//u2
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
						},
						{
							// u13
							name: 'pound',
							identifier: 'lb',
							unitRepresent: Unit.unitRepresentType.QUANTITY,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.UNIT,
							suffix: '',
							displayable: Unit.displayableType.ALL,
							preferredDisplay: false,
							note: 'special unit'
						}
					];
					const conversionData = [
						// adding conversions c11, c12, c13, c14
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
						},
						{
							// c14
							sourceName: 'pound',
							destinationName: 'metric ton',
							bidirectional: true,
							slope: 454.545454,
							intercept: 0,
							note: 'lbs → metric tons'
						}
					];
					// redefining the meterData as the unit is different
					const meterData = [
						{
							name: 'Electric Utility pound of CO₂',
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
					// load data into database
					await prepareTest(unitData, conversionData, meterData);
					// Get the unit ID since the DB could use any value
					const unitId = await getUnitId('pound of CO₂');
					const expected = [0.00486660462797753, 0.0052526287132491];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});
			});
		});
	});
});
