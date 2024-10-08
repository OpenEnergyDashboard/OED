/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for charts quantity meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    createTimeString,
    expectReadingToEqualExpected,
    getUnitId,
    ETERNITY,
    METER_ID,
    GROUP_ID,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWh,
    meterDatakWhGroups,
    groupDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for bar charts', () => {
            mocha.describe('for quantity groups', () => {
                mocha.it('BG1: 1 day bars for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () =>{
                    //loads data into database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh)
                    //gets unit ID
                    const unitId = await getUnitId('kWh');
                    //load data from mcsv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kWh_gu_kWh_st_-inf_et_inf_bd_1.csv')

                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '1',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                mocha.it('BG2: 7 day bars for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () =>{
                    //loads data into database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh)
                    //gets unit ID
                    const unitId = await getUnitId('kWh');
                    //load data from mcsv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kWh_gu_kWh_st_-inf_et_inf_bd_7.csv')

                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '7',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });


                mocha.it('BG3: 28 day bars for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () =>{
                    //load data into database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kWh_gu_kWh_st_-inf_et_inf_bd_28.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '28',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                mocha.it('BG4: 13 day bars for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () =>{
                  //load data into database
                  await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                  //get unit ID since the DB could use any value.
                  const unitId = await getUnitId('kWh');
                  // Load the expected response data from the corresponding csv file
                  const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kWh_gu_kWh_st_-inf_et_inf_bd_13.csv');
                  // Create a request to the API for unbounded reading times and save the response
                  const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                      .query({ 
                          timeInterval: ETERNITY.toString(), 
                          barWidthDays: '13',
                          graphicUnitId: unitId });
                  // Check that the API reading is equal to what it is expected to equal
                  expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                mocha.it('BG5: 75 day bars for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () =>{
                    //load data into database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kWh_gu_kWh_st_-inf_et_inf_bd_75.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '75',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                mocha.it('BG6: 76 day bars (no values) for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () =>{
                    //load data into database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kWh_gu_kWh_st_-inf_et_inf_bd_76.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '76',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });
                // Add BG7 here

                // Add BG8 here

                // Add BG9 here

                // Add BG10 here

                // Add BG11 here
                mocha.it('BG11: 1 day bars for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as BTU reverse conversion', async () => {
                    //load data into database
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
                    await prepareTest(unitData, conversionData, meterDatakWhGroups, groupDatakWh);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('BTU');
                    //Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kWh_gu_BTU_st_-inf_et_inf_bd_1.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '1',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });
                // Add BG12 here

                // Add BG13 here

                // Add BG14 here

            });
        });
    });
});
