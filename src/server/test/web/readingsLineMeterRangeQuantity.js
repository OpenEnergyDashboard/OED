/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const mocha = require('mocha');
const app = require('../../app');
const { prepareTest, getUnitId, parseExpectedCsv, createTimeString, expectRangeToEqualExpected, METER_ID, ETERNITY } = require('./testUtilities');

chai.use(chaiHttp);

const unitDatakWh = [
	{ name: 'kWh', identifier: 'kWh', unitRepresent: 'quantity', secInRate: 3600, typeOfUnit: 'unit', suffix: '', displayable: 'all', preferredDisplay: true, note: 'kWh test unit' }
];
const conversionDatakWh = [];
const meterDatakWh = [
	{ name: 'Electric Meter kWh', unit: 'kWh', defaultGraphicUnit: 'kWh', displayable: true, note: 'test meter', area: 1, areaUnit: 'none', readingFrequency: '15 minutes', meterType: 'other', enabled: true, cumulative: false, cumulativeReset: false, reading: 0, startTimestamp: '2022-08-18 00:00:00', endTimestamp: '2022-11-01 00:00:00' }
];

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for line charts', () => {
			mocha.describe('for range (min/max)', () => {
				mocha.describe('for quantity meters', () => {
	describe('Given kWh units and conversions', () => {
		describe('Given 15 minute reading intervals', () => {
			describe('Given quantity meter units', () => {
				const unitDatakWh = [
					{ name: 'kWh', identifier: 'kWh', unitRepresent: 'quantity', secInRate: 3600, typeOfUnit: 'unit', suffix: '', displayable: 'all', preferredDisplay: true, note: 'kWh test unit' }
				];
				const conversionDatakWh = [];
				const meterDatakWh = [
					{ name: 'Electric Meter kWh', unit: 'kWh', defaultGraphicUnit: 'kWh', displayable: true, note: 'test meter', area: 1, areaUnit: 'none', readingFrequency: '15 minutes', meterType: 'other', enabled: true, cumulative: false, cumulativeReset: false, reading: 0, startTimestamp: '2022-08-18 00:00:00', endTimestamp: '2022-11-01 00:00:00' }
				];

				mocha.it('LR1: range should have daily points for 15 minute reading intervals and quantity units with kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					// Load expected response data from the corresponding csv file
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
					// Create a request to the API for unbounded reading times and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
						.query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: unitId });
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
				}				);

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
					"LR5: API should return readings only within specified time range (15-min intervals, quantity, kWh",
					async () => {
						// Prepare test data using existing utility
						await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
						//Get unit ID for kWh
						const unitId = await getUnitId("kWh");
						//Load the expected data for the LR5 date range and unit configuration
						const expected = await parseExpectedCsv(
							"src/server/test/web/readingsData/expected_line_range_ri_15_mu_kWh_gu_kWh_st_2022-09-21%00#00#00_et_2022-10-06%00#00#00.csv",
						);
						//Send API request using time range and graphic unit
						const res = await chai
							.request(app)
							.get(`/api/unitReadings/line/meters/${METER_ID}`)
							.query({
								timeInterval: createTimeString(
									"2022-09-21",
									"00:00:00",
									"2022-10-06",
									"00:00:00",
								),
								graphicUnitId: unitId,
								readingInterval: 15,
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

<<<<<<< HEAD
				// Add LR18 here
=======
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
>>>>>>> 27d8cc6d3 (remove only)

				// Add LR19 here

				// Add LR20 here

				// Add LR21 here
				});
			});
		});
	});
});
			});
		});
	});
});
