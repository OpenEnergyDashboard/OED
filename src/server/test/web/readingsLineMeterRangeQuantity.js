/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  This file tests the readings retrieval API for line chart quantity meters.
  See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
	parseExpectedCsv,
	expectRangeToEqualExpected,
	createTimeString,
	getUnitId,
	ETERNITY,
	METER_ID,
	unitDatakWh,
	conversionDatakWh,
	meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for line charts', () => {
			mocha.describe('for range (min/max)', () => {
				mocha.describe('for quantity meters', () => {
					// Test using a date range of infinity, which should return as days
					mocha.it('LR1: range should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
						// Load the data into the database
						await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
						// Get the unit ID since the DB could use any value.
						const unitId = await getUnitId('kWh');
						// Load the expected response data from the corresponding csv file
						const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf.csv');
						// Create a request to the API for unbounded reading times and save the response
						const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
							.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
						// Check that the API reading is equal to what it is expected to equal
						expectRangeToEqualExpected(res, expected);
					});

					// Add LR2 here

					// Add LR3 here

					// Add LR4 here
					mocha.it('LR4: range should have hourly points for middle readings of 15 minute for a 60 day period and quantity units with kWh as kWh', async () => {
						const unitData = [
							{
								// u1
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
							}
						];
						const conversionData = [
							{
								// c1
								sourceName: 'Electric_Utility',
								destinationName: 'kWh',
								bidirectional: false,
								slope: 1,
								intercept: 0,
								note: 'Electric_Utility → kWh'
							}
						];
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
								// Note the meter ID is set so we know what to expect when a query is made.
								id: METER_ID
							}
						];
						await prepareTest(unitData, conversionData, meterData);
						// Get the unit ID since the DB could use any value.
						const unitId = await getUnitId('kWh');
						// Load expected response data from the corresponding csv file
						const expected = await parseExpectedCsv('./readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');
						// Create a request to the API for unbounded reading times and save the response
						const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
							.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
						expectRangeToEqualExpected(res, expected);
					});

					// Add LR5 here

					// Add LR6 here

					// Add LR7 here

					// Add LR10 here

					// Add LR11 here

					// Add LR12 here

					// Add LR13 here

					// Add LR18 here

					// Add LR19 here

					// Add LR20 here

					// Add LR21 here
				});
			});
		});
	});
});
