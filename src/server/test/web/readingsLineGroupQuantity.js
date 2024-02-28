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
    // createTimeString,
    getUnitId,
    ETERNITY,
    // METER_ID,
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

                // Add LG2 here

                // Add LG3 here

                // Add LG4 here

                // Add LG5 here

                // Add LG6 here

                // Add LG7 here

                // Add LG10 here

                mocha.it('LG11: should have daily points for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as MJ reverse conversion', async () => {
                    const unitData = unitDatakWh.concat([
                        { 
                            // u3
                            name: 'MJ', 
                            identifier: 'megaJoules', 
                            unitRepresent: Unit.unitRepresentType.QUANTITY, 
                            secInRate: 3600, typeOfUnit: Unit.unitType.UNIT, 
                            suffix: '', 
                            displayable: Unit.displayableType.ALL, 
                            preferredDisplay: false, 
                            note: 'MJ' 
                        }
                    ]);
                    const conversionData = conversionDatakWh.concat([
                        { 
                            // c6
                            sourceName: 'MJ', 
                            destinationName: 'kWh',
                            bidirectional: true, 
                            slope: 1 / 3.6, 
                            intercept: 0, 
                            note: 'MJ → KWh' 
                        }
                    ]);
                    // Load the data into the database
                    await prepareTest(unitData, conversionData, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB can use any value
                    const unitId = await getUnitId('MJ');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_MJ_st_-inf_et_inf.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                // Add LG12 here

                // Add LG13 here

                // Add LG18 here

                // Add LG19 here

                // Add LG20 here

                // Add LG21 here

            });
        });
    });
});
