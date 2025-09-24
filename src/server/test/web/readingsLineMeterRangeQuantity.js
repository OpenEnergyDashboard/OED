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

					mocha.it('LR2: range should have daily points for 15 minute reading intervals and quantity units with explicit start/end time & kWh as kWh', async () => {
						// Load the data into the database
						await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
						// Get the unit ID since the DB could use any value.
						const unitId = await getUnitId('kWh');
						// Load the expected response data from the corresponding csv file
						const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
						// Create a request to the API for unbounded reading times and save the response
						const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
							.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: unitId });
						// Check that the API reading is equal to what it is expected to equal
						expectRangeToEqualExpected(res, expected);
					});

					// Add LR3 here
					mocha.it('LR3: range should have daily points for middle readings of 15 minute for a 61 day period and quantity units with kWh as kWh', async () => {
						// 1) Seed DB with the standard unit/meter data for kWh
						await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);

						// 2) Resolve the kWh graphic unit id (DB can assign any id)
						const unitId = await getUnitId('kWh');

						// 3) Load the expected series for a 61-day window (daily points expected)
						const expected = await parseExpectedCsv(
							'src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-25%00#00#00.csv',
						);

						// 4) Hit the API for the same window & unit
						const res = await chai
							.request(app)
							.get(`/api/unitReadings/line/meters/${METER_ID}`)
							.query({
								timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-25', '00:00:00'),
								graphicUnitId: unitId,
						});

						// 5) Assert the API response matches the expected CSV (shape + values)
						expectRangeToEqualExpected(res, expected);
					});


					mocha.it('LR4: range should have hourly points for middle readings of 15 minute for a 60 day period and quantity units with kWh as kWh', async () => {
						await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
						// Get the unit ID since the DB could use any value.
						const unitId = await getUnitId('kWh');
						// Load expected response data from the corresponding csv file
						const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');
						// Create a request to the API for unbounded reading times and save the response
						const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
							.query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
						expectRangeToEqualExpected(res, expected);
					});

					mocha.it(
						'LR5: range should barely have hourly points for middle readings of 15 minute for a 15 day + 15 min period and quantity units with kWh as kWh',
						async () => {
							// Prepare test data using existing utility
							await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
							//Get unit ID for kWh
							const unitId = await getUnitId('kWh');
							//Load the expected data for the LR5 date range and unit configuration
							const expected = await parseExpectedCsv(
								'src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-09-21%00#00#00_et_2022-10-06%00#15#00.csv',
							);
							//Send API request using time range and graphic unit
							const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
								.query({
									timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-06', '00:15:00'),
									graphicUnitId: unitId
								});
							//Assert the response only includes data within that range and format
							expectRangeToEqualExpected(res, expected);
						},
					);

					// Add LR6 here

					mocha.it(
						'LR7: range with partial days/hours for daily gives only full days',
						async () => {
							// Prepare test data using existing utility
							await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
							//Get unit ID for kWh
							const unitId = await getUnitId('kWh');
							//Load the expected data for the LR7 date range and unit configuration
							const expected = await parseExpectedCsv(
								'src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-08-20%07#25#35_et_2022-10-28%13#18#28.csv',
							);
							//Send API request using time range and graphic unit
							const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
								.query({
									timeInterval: createTimeString('2022-08-20', '07:25:35', '2022-10-28', '13:18:28'),
									graphicUnitId: unitId
								});
							//Assert the response only includes data within that range and format
							expectRangeToEqualExpected(res, expected);
						},
					);

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
