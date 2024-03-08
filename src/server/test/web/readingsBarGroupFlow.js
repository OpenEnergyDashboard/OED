/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for charts quantity meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
// const { prepareTest,
//     parseExpectedCsv,
//     createTimeString,
//     expectReadingToEqualExpected,
//     getUnitId,
//     ETERNITY,
//     METER_ID,
//     unitDatakWh,
//     conversionDatakWh,
//     meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for bar charts', () => {
            mocha.describe('for quantity groups', () => {

                // Add BG15 here

                // Add BG16 here

            });
        });
    });
});
