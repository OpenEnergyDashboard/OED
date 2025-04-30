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

                    // Add LR9 here
                    mocha.it('LR9: line chart, range aggregation, raw data (Degrees -> C), daily, no normalization', async () => {
                        // Define units u6 (C) and u7 (Degrees)
                        const unitDataDegreesC = [
                            { name: 'C', identifier: '', unitRepresent: Unit.unitRepresentType.RAW, secInRate: 3600, typeOfUnit: Unit.unitType.UNIT, suffix: '', displayable: Unit.displayableType.ALL, preferredDisplay: true, note: 'Celsius' },
                            { name: 'Degrees', identifier: '', unitRepresent: Unit.unitRepresentType.RAW, secInRate: 3600, typeOfUnit: Unit.unitType.METER, suffix: '', displayable: Unit.displayableType.NONE, preferredDisplay: false, note: 'special unit' }
                        ];
                        // Define conversion c5 (Degrees -> C)
                        const conversionDataDegreesC = [
                            { sourceName: 'Degrees', destinationName: 'C', bidirectional: false, slope: 1, intercept: 0, note: 'Degrees → C' }
                        ];
                        // Define meter using Degrees unit and standard input file
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
                        // Using filename based on test description (Degrees -> C), not the likely typo in testing.md (kW -> kW)
                        const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_range_ri_15_mu_C_gu_C_st_-inf_et_inf.csv');

						const res = await chai.request(app)
                            .get(`/api/unitReadings/line/meters/${METER_ID}?timeInterval=${ETERNITY.toString()}&graphicUnitId=${graphicUnitIdC}`);
                        // Check result matches expected csv file
                        expectRangeToEqualExpected(res, expected);
                    });

                    // Add LR14 here

                    // Add LR15 here

                    // Add LR16 here

                    // Add LR17 here

                    // Add LR22 here
                });
            });
        });
    });
});
