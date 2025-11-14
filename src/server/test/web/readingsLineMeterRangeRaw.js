/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for line chart raw meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    expectReadingToEqualExpected,
    expectRangeToEqualExpected,
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
            mocha.describe('for range (min/max)', () => {
                mocha.describe('for raw meters', () => {

                    mocha.it('LR9: range should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & Celsius as Celsius', async () => {
                        const unitC = {
                            // u6
                            name: 'C',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: true,
                            note: 'Celsius'
                        };
                        const unitDegrees = {
                            // u7
                            name: 'Degrees',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: '',
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: 'special unit'
                        };
                        const unitDataDegreesC = [unitC, unitDegrees];

                        const conversionDataDegreesC = [
                            {
                                // c5
                                sourceName: 'Degrees',
                                destinationName: 'C',
                                bidirectional: false,
                                slope: 1,
                                intercept: 0,
                                note: 'Degrees → C'
                            }
                        ];

                        const meterDataDegrees = [
                            {
                                name: 'Temp Fahrenheit in Celsius',
                                unit: 'Degrees',
                                defaultGraphicUnit: 'C',
                                displayable: true,
                                gps: undefined,
                                note: 'special meter for raw temp data',
                                file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                                deleteFile: false,
                                readingFrequency: '15 minutes',
                                id: METER_ID
                            }
                        ];
                        await prepareTest(unitDataDegreesC, conversionDataDegreesC, meterDataDegrees);
                        // Get the graphic unit ID for 'C'
                        const graphicUnitIdC = await getUnitId('C');

                        const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_range_ri_15_mu_kW_gu_kW_st_-inf_et_inf.csv');

                        const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                            .query({ timeInterval: ETERNITY.toString(), graphicUnitId: graphicUnitIdC });
                        // Check result matches expected csv file
                        expectRangeToEqualExpected(res, expected);
                    });

                    // Add LR14 here
                    mocha.it('range should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as F with intercept', async () => {
                        
                    })
                    // Add LR15 here

                    // Add LR16 here

                    // Add LR17 here

                    // Add LR22 here
                });
            });
        });
    });
});
