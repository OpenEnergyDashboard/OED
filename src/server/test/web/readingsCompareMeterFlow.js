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
	METER_ID} = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for compare charts', () => {
			mocha.describe('for meters', () => {
				mocha.it('C15: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and flow units & kW as kW', async () => {
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
					const unitId = await getUnitId('kW');
					const expected = [1990.55774277443, 2057.611897078];

					const res = await chai.request(app)
						.get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P7D',
							graphicUnitId: unitId
						});

					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C16: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and flow units & thing as thing where rate is 36', async () => {
					// These are the 2D arrays for units and conversions to feed into the database
					// For Thing units.
					const unitDataThing = [
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

					const conversionDataThing_36 = [
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

					const meterDataThing_36 = [
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
					]

					// Initialize test database with "thing" data
					await prepareTest(unitDataThing, conversionDataThing_36, meterDataThing_36);

					// Get the unit ID since the DB could use any value
					const unitId = await getUnitId('thing unit');
					// Expected was taken from the `curr use, prev use` column for this test case, since this is a compare readings test
					const expected = [199055.77427744, 205761.1897078];

					// Create a request to the API and save the response
					// Note: the api paths are located in app.js, but this specific one points to compareReadings.js
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P7D',
							graphicUnitId: unitId
						});

					// Check that the API reading is equal to what it is expected to equal
					expectCompareToEqualExpected(res, expected, METER_ID);
				})

				mocha.it('C17: 1 full day shift for 15 minute reading intervals and flow units & kW as kW', async () => {
					// Units and Conversions
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

					const conversionDataElectric = [
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

					const meterDataElectric = [
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

					await prepareTest(unitData, conversionDataElectric, meterDataElectric);
					const unitId = await getUnitId('kW');
					const expected = [1210.55315436926, 1349.13987250313];

					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 00:00:00',
							shift: "P1D",
							graphicUnitId: unitId
						});

					expectCompareToEqualExpected(res, expected);

				});

				mocha.it('C18: 28 day shift for 26 days for 15 minute reading intervals and flow units & kW as kW', async () =>{
					unitData = [ 
						{
							//u4
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
							//u5
							name: 'Electric',
							identifier: '',
							unitRepresent: Unit.unitRepresentType.FLOW,
							secInRate: 3600,
							typeOfUnit: Unit.unitType.METER,
							suffix: '',
							displayable: Unit.displayableType.NONE,
							preferredDisplay: false,
							note: 'special unit'
						},
					];
					conversionData = [
						{
							//c4
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
					const unitId = await getUnitId('kW');
					const expected = [30830.9420431404, 31064.5397007187];    

					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-02 00:00:00',
							curr_end: '2022-10-28 00:00:00',
							shift: 'P28D',
							graphicUnitId: unitId
						});
					
					expectCompareToEqualExpected(res, expected, METER_ID);

				});
	
				// Add C19 here

				// Add C20 here
			});
		});
	});
});
