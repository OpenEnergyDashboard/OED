/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for charts quantity meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, expect, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    expectReadingToEqualExpected,
    getUnitId,
    ETERNITY,
    METER_ID,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for bar charts', () => {
            mocha.describe('for quantity meters', () => {
                // The logic here is effectively the same as the line charts, however bar charts have an added
                // barWidthDays parameter that must be accounted for, which adds a few extra steps
                mocha.it('B1: 1 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
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
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
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
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
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
                mocha.it('B4: 13 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf_bd_13.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                        .query({
                            timeInterval: ETERNITY.toString(),
                            barWidthDays: 13,
                            graphicUnitId: unitId
                        });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected);
                });

                // Add B5 here

                mocha.it('B6: 76 day bars (no values) for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf_bd_76.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                        .query({
                            timeInterval: ETERNITY.toString(),
                            barWidthDays: 76,
                            graphicUnitId: unitId
                        });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected);
                });

                // Add B7 here

                // Add B8 here

                // Add B9 here

                // Add B10 here

                // Add B11 here

                mocha.it('B12: 1 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kg of CO2', async () => {
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
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Electric_Utility kg of CO₂',
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
                    const unitId = await getUnitId('kg of CO₂');
                    // Load the expected response data from the corresponding csv file
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_kgCO2_st_-inf_et_inf_bd_1.csv');
                    // Create a request to the API with specific parameters for B12 and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                        .query({
                            timeInterval: ETERNITY.toString(), // Replace with the specific time interval for B12
                            barWidthDays: 1, // Replace with the specific bar width for B12
                            graphicUnitId: unitId
                        });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected);
                });

                // Add B13 here

                mocha.it('B14: 1 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as lbs of CO2 & chained & reversed', async () => {
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
                    const meterData = [
                        {
                            name: 'Electric_Utility pound of CO₂',
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
                    
                    // Load the data into the database
                    await prepareTest(unitData, conversionData, meterData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId("pound of CO₂");
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_lbsCO2_st_-inf_et_inf_bd_1.csv');
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

            });
        });
    });
});
