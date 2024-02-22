/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for line chart quantity groups.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    expectReadingToEqualExpected,
    createTimeString,
    getUnitId,
    ETERNITY,
    METER_ID,
    GROUP_ID,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWhGroups,
    groupDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for line charts', () => {
            mocha.describe('for quantity groups', () => {
                // Test using a date range of infinity, which should return as days
                mocha.it('LG1: should have daily points for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_kWh_st_-inf_et_inf.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });
                mocha.it('LG2: should have daily points for 15 + 20 minute reading intervals and quantity units with explicit start/end time & kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });
                mocha.it('LG3: should have daily points for middle readings of 15 + 20 minute for a 61 day period and quantity units with kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-25%00#00#00.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-25', '00:00:00'), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });
                mocha.it('LG4: should have hourly points for middle readings of 15 + 20 minute for a 60 day period and quantity units with kWh as kWh', async () => {
                    //Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    //Get the unitID since the DB could be any value
                    const unitId = await getUnitId('kWh');
                    //Load the expected response data from the csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');
                    // Create a request API for the 60days period
                    const startDate = "2022-08-25";
                    const endDate = "2022-10-24";
                    const time = "00:00:00";
                    const timeInterval = createTimeString(startDate, time, endDate, time);
                    //Create request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval, graphicUnitId: unitId });
                    //Check if the Readings is equal to the expected file
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                // Add LG5 here

                // Add LG6 here
                mocha.it('LG6: 14 days still gives hourly points & middle readings', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_kWh_st_2022-09-21%00#00#00_et_2022-10-05%00#00#00.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-05', '00:00:00'), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                // Add LG7 here

                // Test using a data range of infinity, which should return as days
                mocha.it('LG10: should have daily points for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as MJ', async () => {
                    // Add MegaJoules unit to our unitData list
                    const unitData = unitDatakWh.concat([
                        {
                            name: 'MJ',
                            identifier: 'megaJoules',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT, suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'MJ'
                        }
                    ]);
                    // Add kWh -> MJ conversion to our conversionData list
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
                    // Converts meters from kWh to MJ
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
                            // Test 15 minutes
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        },
                        {
                            name: 'Electric Utility Other',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'MJ',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            // Test 20 minutes
                            readingFrequency: '20 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    // Group data as MegaJoules instead of kWh.
                    const groupData = [
                        {
                            id: GROUP_ID,
                            name: 'Electric Utility MJ + Other',
                            displayable: true,
                            note: 'special group',
                            defaultGraphicUnit: 'MJ',
                            childMeters: ['Electric Utility MJ', 'Electric Utility Other'],
                            childGroups: [],
                        }
                    ]
                    // Load the data into the database
                    await prepareTest(unitData, conversionData, meterData, groupData);
                    //Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('MJ');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_MJ_st_-inf_et_inf.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                })

                // Add LG11 here

                // Add LG12 here

                // Add LG13 here

                mocha.it('LG18: should have daily points for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kg of CO2', async () => {
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
                       
                    ];
                    const meterData = [
                        {
                            name: 'Electric Utility kg of CO₂',
                            unit: 'Electric_Utility',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        },
                        {
                            name: 'Electric Utility kg of CO₂ Other',
                            unit: 'Electric_Utility',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '20 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    const groupData = [
                        {
                            name: 'Electric Utility kg of CO₂ + Other',
                            displayable: true,
                            note: 'special group',
                            areaUnit: 'meters',
                            childMeters: ['Electric Utility kg of CO₂', 'Electric Utility kg of CO₂ Other'],
                            childGroups: [],
                            id: GROUP_ID
                        }
                    ];
                    // Load the data into the database
                    await prepareTest(unitData, conversionData, meterData, groupData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kg of CO₂');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_kgCO2_st_-inf_et_inf.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

				mocha.it('LG19: should have daily points for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as metric ton of CO2 & chained', async () => {
					const unitDatakWh = [
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
					const conversionDatakWh = [
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
					const meterDatakWhGroups = [
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
						},
						{
							name: 'Electric Utility metric ton of CO₂ Other',
							unit: 'Electric_Utility',
							displayable: true,
							gps: undefined,
							note: 'special meter',
							file: 'test/web/readingsData/readings_ri_20_days_75.csv',
							deleteFile: false,
							readingFrequency: '20 minutes',
							id: (METER_ID + 1)
						}
					];
					const groupDatakWh = [
						{
							id: GROUP_ID,
							name: 'Electric Utility kWh + Other',
							displayable: true,
							note: 'special group',
							childMeters: ['Electric_Utility metric ton of CO₂', 'Electric Utility metric ton of CO₂ Other'],
							childGroups: [],
						}
					];
					// Load the data into the database
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('metric ton of CO₂');
					// Load the expected response data from the corresponding csv file
					const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_MTonCO2_st_-inf_et_inf.csv');
					// Create a request to the API for unbounded reading times and save the response
					const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
						.query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
					// Check that the API reading is equal to what it is expected to equal
					expectReadingToEqualExpected(res, expected, GROUP_ID);
				});

                // Add LG20 here

                // Add LG21 here

            });
        });
    });
});
