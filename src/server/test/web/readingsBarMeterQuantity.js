/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for charts quantity meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/
const { chai, mocha, expect, app } = require('../common');
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

                // Add B6 here

                // Add B7 here

                // Add B8 here
                mocha.it('B8: 1 day bars for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as MJ', async () => {
                    // Load the data into the database
                    const unitData = unitDatakWh.concat([
                        {
                            // add u3
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
                            // add c2
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
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kWh_gu_MJ_st_-inf_et_inf_bd_1.csv');
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

                // Add B9 here

                // Add B10 here

                // Add B11 here

                // Add B12 here

                // Add B13 here

                // Add B14 here

            });
        });
    });
});
