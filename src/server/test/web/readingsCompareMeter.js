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
    METER_ID,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for compare charts', () => {
            mocha.describe('for meters', () => {
                // Test 15 minutes over all time for flow unit.
                mocha.it('Expected and actual data should line up', async () => {
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = { '100': { curr_use: '7962.23097109771', prev_use: '8764.06090894387'} };
                    // for compare, need the unitID, currentStart, currentEnd, shift
                    const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
                        .query({
                            curr_start: '2022-10-30 00:00:00',
                            curr_end: '2022-10-31 17:00:00',
                            shift: 'P1D',
                            graphicUnitId: unitId
                        });
                    console.log('res.body: ' , res.body);
                    expectCompareToEqualExpected(res, expected);
                });
            });
        });
    });
});
