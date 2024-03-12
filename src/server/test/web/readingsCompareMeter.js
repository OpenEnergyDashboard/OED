/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API compare chart meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    expectCompareToEqualExpected,
    getUnitId,
    ETERNITY,
    METER_ID } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for compare charts', () => {
            mocha.describe('for meters', () => {
                // Test 15 minutes over all time for flow unit.
                mocha.it('Expected and actual data should line up', async () => {
                    await prepareTest(unitData, conversionData, meterData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = '';
                    //for compare, need the unitID, currentStart, currentEnd, shift
                    const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
                        .query({ 
                            currStart: "2022-10-30T00:00:00.000Z",
                            currEnd: "2022-10-31T17:00:00.000Z",
                            shift: 'P1D',
                            graphicUnitID: unitId
                        });
                    expectCompareToEqualExpected(res, expected);
                });
            });
        });
    });
});
