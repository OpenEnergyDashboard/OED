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
            mocha.describe('for raw meters', () => {
                // Test 15 minutes over all time for raw unit.
                mocha.it('L9: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & Celsius as Celsius', async () => {
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
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kW_gu_kW_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L14: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as F with intercept', async () => {
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
                        },
                        {
                            // u8
                            name: 'F',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
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
                        },
                        {
                            // c7
                            sourceName: 'C',
                            destinationName: 'F',
                            bidirectional: true,
                            slope: 1.8,
                            intercept: 32,
                            note: 'Celsius → Fahrenheit'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Degrees F',
                            unit: 'Degrees',
                            defaultGraphicUnit: 'F',
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
                    const unitId = await getUnitId('F');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L15: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as F with intercept reverse conversion', async () => {
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
                        },
                        {
                            // u8
                            name: 'F',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
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
                        },
                        {
                            // c8
                            sourceName: 'F',
                            destinationName: 'C',
                            bidirectional: true,
                            slope: 1 / 1.8,
                            intercept: -32 / 1.8,
                            note: 'Fahrenheit → Celsius'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Degrees F',
                            unit: 'Degrees',
                            defaultGraphicUnit: 'F',
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
                    const unitId = await getUnitId('F');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L16: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as Widget with intercept & chained', async () => {
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
                        },
                        {
                            // u8
                            name: 'F',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
                        },
                        {
                            // u9
                            name: 'Widget',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'fake unit'
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
                        },
                        {
                            // c7
                            sourceName: 'C',
                            destinationName: 'F',
                            bidirectional: true,
                            slope: 1.8,
                            intercept: 32,
                            note: 'Celsius → Fahrenheit'
                        },
                        {
                            // c9
                            sourceName: 'F',
                            destinationName: 'Widget',
                            bidirectional: true,
                            slope: 5,
                            intercept: 3,
                            note: 'Fahrenheit → Widget'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Degrees Widget',
                            unit: 'Degrees',
                            defaultGraphicUnit: 'Widget',
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
                    const unitId = await getUnitId('Widget');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_Widget_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L17: should have daily points for 15 minute reading intervals and raw units with +-inf start/end time & C as Widget with intercept & chained & reverse conversions', async () => {
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
                        },
                        {
                            // u8
                            name: 'F',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
                        },
                        {
                            // u9
                            name: 'Widget',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'fake unit'
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
                        },
                        {
                            // c8
                            sourceName: 'F',
                            destinationName: 'C',
                            bidirectional: true,
                            slope: 1 / 1.8,
                            intercept: -32 / 1.8,
                            note: 'Fahrenheit → Celsius'
                        },
                        {
                            // c10
                            sourceName: 'Widget',
                            destinationName: 'F',
                            bidirectional: true,
                            slope: 0.2,
                            intercept: -3 / 5,
                            note: 'Fahrenheit → Widget'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Degrees Widget',
                            unit: 'Degrees',
                            defaultGraphicUnit: 'Widget',
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
                    const unitId = await getUnitId('Widget');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_Widget_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L22: should have hourly points for middle readings of 15 minute for a 60 day period and raw units & C as F with intercept', async () => {
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
                        },
                        {
                            // u8
                            name: 'F',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
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
                        },
                        {
                            // c7
                            sourceName: 'C',
                            destinationName: 'F',
                            bidirectional: true,
                            slope: 1.8,
                            intercept: 32,
                            note: 'Celsius → Fahrenheit'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Degrees F',
                            unit: 'Degrees',
                            defaultGraphicUnit: 'F',
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
                    const unitId = await getUnitId('F');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L24: should have raw points for middle readings of 15 minute for a 14 day period and raw units & C as F with intercept', async () => {
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
                        },
                        {
                            // u8
                            name: 'F',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.RAW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
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
                        },
                        {
                            // c7
                            sourceName: 'C',
                            destinationName: 'F',
                            bidirectional: true,
                            slope: 1.8,
                            intercept: 32,
                            note: 'Celsius → Fahrenheit'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Degrees F',
                            unit: 'Degrees',
                            defaultGraphicUnit: 'F',
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
                    const unitId = await getUnitId('F');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_C_gu_F_st_2022-09-21%00#00#00_et_2022-10-05%00#00#00.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-05', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
            });
        });
    });
});
