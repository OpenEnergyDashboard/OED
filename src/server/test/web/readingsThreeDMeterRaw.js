/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for 3D chart raw meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    expectThreeDReadingToEqualExpected,
    createTimeString,
    getUnitId,
    METER_ID } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for 3D charts', () => {
            mocha.describe('for raw meters', () => {
                mocha.it('D14: 15 minute readings, 4 hours/point, full time range and raw units of Celsius as Celsius', async () => {
                    const unitData = [
                        {
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
                        },
                        {
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
                        }
                    ];
                    const conversionData = [
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
                    const meterData = [
                        {
                            name: 'Degrees Celsius',
                            unit: 'Degrees',
                            defaultGraphicUnit: 'C',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        }
                    ];
                    await prepareTest(unitData, conversionData, meterData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('C');
                    // Hours per reading returned.
                    const timePerReading = 4;
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv(
                        'src/server/test/web/readingsData/expected_3d_hp_4_ri_15_mu_kW_gu_kW_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/meters/${METER_ID}`)
                        .query({
                            timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
                            graphicUnitId: unitId, readingInterval: timePerReading
                        });
                    expectThreeDReadingToEqualExpected(res, expected, timePerReading);
                });
            });
        });
    });
});
