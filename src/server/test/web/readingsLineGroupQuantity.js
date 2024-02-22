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
    getUnitId,
    ETERNITY,
    // METER_ID,
    GROUP_ID,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWhGroups,
    groupDatakWh, 
    createTimeString} = require('../../util/readingsUtils');

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

                // Add LG11 here

                // Add LG12 here

                // Add LG13 here

                // Add LG18 here

                // Add LG19 here

                // Add LG20 here

                // Add LG21 here
                mocha.it('LG21: should have daily points for 15 + 20 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
                    // Load the data into the database
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
                        }
                    ]);
                    await prepareTest(unitData, conversionData, meterDatakWhGroups, groupDatakWh);
                    // needs u1 u2 u3 c1 c2
                    // u1: { name: 'kWh', identifier: '', unitRepresent: Unit.unitRepresentType.QUANTITY, secInRate: 3600, typeOfUnit: Unit.unitType.UNIT, suffix: '', displayable: Unit.displayableType.ALL, preferredDisplay: true, note: 'OED created standard unit' }
                    // u2: { name: 'Electric_Utility', identifier: '', unitRepresent: Unit.unitRepresentType.QUANTITY, secInRate: 3600, typeOfUnit: Unit.unitType.METER, suffix: '', displayable: Unit.displayableType.NONE, preferredDisplay: false, note: 'special unit' }
                    // u3: { name: 'MJ', identifier: 'megaJoules', unitRepresent: Unit.unitRepresentType.QUANTITY, secInRate: 3600, typeOfUnit: Unit.unitType.UNIT, suffix: '', displayable: Unit.displayableType.ALL, preferredDisplay: false, note: 'MJ' }
                    // c1: { sourceName: 'Electric_Utility', destinationName: 'kWh', bidirectional: false, slope: 1, intercept: 0, note: 'Electric_Utility → kWh' }
                    // c2: { sourceName: 'kWh', destinationName: 'MJ', bidirectional: true, slope: 3.6, intercept: 0, note: 'kWh → MJ' }

                    // include new units up top in include statement
                    // potentially add new units to prepareTest line

                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('MJ');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_group_ri_15-20_mu_kWh_gu_MJ_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/groups/${GROUP_ID}`)
                    // make sure test is asking for the correct endpoint
                    // ask for data (get) check it and make sure it is right
                        .query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
                        // simulates a query parameter
                        // chose the correct parameters for the query line which will set up the appropriate http request
                        // change timeInterval

                        // to test open localhost3000 dev tools network tab
                        // get data to use on localhost
                        // look for appropriate/correct timeinterval format
                            // reverse engineer this and put it back into test

                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });
            });
        });
    });
});
