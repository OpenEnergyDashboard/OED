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
    unitDatakWh,
    conversionDatakWh,
    meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for bar charts', () => {
            mocha.describe('for quantity groups', () => {

                // Add BG15 here
                mocha.it('BG15: should have daily points for 15 + 20 minute reading intervals and flow units with +-inf start/end time & kW as kW', async () =>{
                    //load data into database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWGroups, groupDatakWh);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('kW');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kW_gu_kW_st_-inf_et_inf.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: 'L6:N10',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                // Add BG16 here

            });
        });
    });
});
