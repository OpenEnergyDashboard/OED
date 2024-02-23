/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for line chart quantity meters (with added min/max values).
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    expectMaxMinToEqualExpected,
    createTimeString,
    getUnitId,
    ETERNITY,
    METER_ID,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for line charts', () => {
            mocha.describe('for quantity meters', () => {
                // This date range is on the threshold of returning daily point readings, 61 days
                mocha.it('L3: should have daily points for middle readings of 15 minute for a 61 day period and quantity units with kWh as kWh', async () => {
                    // Load the data into the database (u1, u2, c1)
                    const unitData = unitDatakWh.concat([
                        {
                            // u1
                            name: 'kWh',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: true,
                            note: 'OED created standard unit'
                        },
                        {
                            //u2
                            name: 'Electric_Utility',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: '',
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: 'special unit'
                        }
                    ]);
                    const conversionData = conversionDatakWh.concat([
                        {
                            // c6
                            sourceName: 'MJ',
                            destinationName: 'hWh',
                            bidirectional: true,
                            slope: 1 / 3.6,
                            intercept: 0,
                            note: 'MJ → KWh'
                        }
                    ]);
                    const meterData = [
                        {
                            name: 'Electric Utility MJ',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: '',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'expected_line_minmax__ri_15_mu_kWh_gu_kWh_st_2022-08-25000000_et_2022-10-25000000.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        }
                    ];
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_minmax__ri_15_mu_kWh_gu_kWh_st_2022-08-25000000_et_2022-10-25000000.csv'');
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-25', '00:00:00'), graphicUnitId: unitId });
                    expectMaxMinToEqualExpected(res, expected);
                });
            });
        });
    });
});