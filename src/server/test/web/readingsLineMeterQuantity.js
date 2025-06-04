/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for line chart quantity meters.
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
            mocha.describe('for quantity meters', () => {
                // Test using a date range of infinity, which should return as days
                mocha.it('L1: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_-inf_et_inf.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected);
                });
                // This test is effectively the same as the last, but we specify the date range
                // Should return daily point readings
                mocha.it('L2: should have daily points for 15 minute reading intervals and quantity units with explicit start/end time & kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load and parse the corresponding expected values from csv
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
                    // Create a request to the API for the date range specified using createTimeString and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected);
                });
                // This date range is on the threshold of returning daily point readings, 61 days
                mocha.it('L3: should have daily points for middle readings of 15 minute for a 61 day period and quantity units with kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-25%00#00#00.csv');
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-25', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected);
                });
                mocha.it('L4: should have hourly points for middle readings of 15 minute for a 60 day period and quantity units with kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected);
                });
                mocha.it('L5: should barely have hourly points for middle readings of 15 minute for a 15 day + 15 min period and quantity units with kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-09-21%00#00#00_et_2022-10-06%00#00#00.csv');
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-06', '00:15:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected);
                });
                // 14 days barely gives raw points & middle readings
                mocha.it('L6: 14 days barely gives raw points & middle readings', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-09-21%00#00#00_et_2022-10-05%00#00#00.csv');
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-05', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected);
                });

                //partial days/hours for daily gives only full days
                mocha.it('L7: partial days/hours for daily gives only full days', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kWh_st_2022-08-20%07#25#35_et_2022-10-28%13#18#28.csv');
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-20', '07:25:35', '2022-10-28', '13:18:28'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected);
                });

                mocha.it('L10: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as MJ', async () => {
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
                    const meterData = [
                        {
                            name: 'Electric Utility MJ',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'MJ',
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
                    const unitId = await getUnitId('MJ');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L11: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as MJ reverse conversion', async () => {
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
                            // c6
                            sourceName: 'MJ',
                            destinationName: 'kWh',
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
                            defaultGraphicUnit: 'MJ',
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
                    const unitId = await getUnitId('MJ');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L12: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as BTU chained', async () => {
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
                        },
                        {
                            // u16
                            name: 'BTU',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: true,
                            note: 'special unit'
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
                        },
                        {
                            // c3
                            sourceName: 'MJ',
                            destinationName: 'BTU',
                            bidirectional: true,
                            slope: 947.8,
                            intercept: 0,
                            note: 'MJ → BTU'
                        }
                    ]);
                    const meterData = [
                        {
                            name: 'Electric_Utility BTU',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'BTU',
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
                    const unitId = await getUnitId('BTU');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_BTU_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });

                mocha.it('L13: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as BTU chained with reverse conversion', async () => {
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
                        },
                        {
                            // u16
                            name: 'BTU',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: true,
                            note: 'OED created standard unit'
                        }
                    ]);
                    const conversionData = conversionDatakWh.concat([
                        {
                            // c3
                            sourceName: 'MJ',
                            destinationName: 'BTU',
                            bidirectional: true,
                            slope: 947.8,
                            intercept: 0,
                            note: 'MJ → BTU'
                        },
                        {
                            // c6
                            sourceName: 'MJ',
                            destinationName: 'kWh',
                            bidirectional: true,
                            slope: 1 / 3.6,
                            intercept: 0,
                            note: 'MJ → KWh'
                        }
                    ]);
                    const meterData = [
                        {
                            name: 'Electric_Utility BTU',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'BTU',
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
                    const unitId = await getUnitId('BTU');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_BTU_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });

                mocha.it('L18: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as kg of CO2', async () => {
                    const unitData = [
                        {
                            // u2 
                            name: 'Electric_Utility',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: '',
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: 'special unit'
                        },
                        {
                            // u10
                            name: 'kg',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
                        },
                        {
                            // u12
                            name: 'kg CO₂',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: 'CO₂',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'special unit'
                        }
                    ];
                    const conversionData = [
                        {
                            // c11
                            sourceName: 'Electric_Utility',
                            destinationName: 'kg CO₂',
                            bidirectional: false,
                            slope: 0.709,
                            intercept: 0,
                            note: 'Electric_Utility → kg CO₂'
                        },
                        {
                            // c12
                            sourceName: 'kg CO₂',
                            destinationName: 'kg',
                            bidirectional: false,
                            slope: 1,
                            intercept: 0,
                            note: 'CO₂ → kg'
                        },

                    ];
                    const meterData = [
                        {
                            name: 'Electric_Utility kg of CO₂',
                            unit: 'Electric_Utility',
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
                    const unitId = await getUnitId('kg of CO₂');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_kgCO2_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });

                mocha.it('L19: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as metric ton of CO2 & chained', async () => {
                    const unitData = [
                        {
                            // u2 - add by self since not want kWh
                            name: 'Electric_Utility',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: '',
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: 'special unit'
                        },
                        {
                            // u10
                            name: 'kg',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
                        },
                        {
                            // u11
                            name: 'metric ton',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
                        },
                        {
                            // u12
                            name: 'kg CO₂',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: 'CO₂',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'special unit'
                        }
                    ];
                    const conversionData = [
                        {
                            // c11
                            sourceName: 'Electric_Utility',
                            destinationName: 'kg CO₂',
                            bidirectional: false,
                            slope: 0.709,
                            intercept: 0,
                            note: 'Electric_Utility → kg CO₂'
                        },
                        {
                            // c12
                            sourceName: 'kg CO₂',
                            destinationName: 'kg',
                            bidirectional: false,
                            slope: 1,
                            intercept: 0,
                            note: 'CO₂ → kg'
                        },
                        {
                            // c13
                            sourceName: 'kg',
                            destinationName: 'metric ton',
                            bidirectional: true,
                            slope: 1e-3,
                            intercept: 0,
                            note: 'kg → Metric ton'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Electric_Utility metric ton of CO₂',
                            unit: 'Electric_Utility',
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
                    const unitId = await getUnitId('metric ton of CO₂');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MTonCO2_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });

                mocha.it('L20: should have daily points for 15 minute reading intervals and quantity units with +-inf start/end time & kWh as lbs of CO2 & chained & reversed', async () => {
                    const unitData = [
                        {
                            name: 'Electric_Utility',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: '',
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: 'special unit'
                        },
                        {
                            name: 'kg',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
                        },
                        {
                            name: 'metric ton',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'OED created standard unit'
                        },
                        {
                            name: 'kg CO₂',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: 'CO₂',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'special unit'
                        },
                        {
                            name: 'pound',
                            identifier: 'lb',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'special unit'
                        }
                    ];
                    const conversionData = [
                        {
                            sourceName: 'Electric_Utility',
                            destinationName: 'kg CO₂',
                            bidirectional: false,
                            slope: 0.709,
                            intercept: 0,
                            note: 'Electric_Utility → kg CO₂'
                        },
                        {
                            sourceName: 'kg CO₂',
                            destinationName: 'kg',
                            bidirectional: false,
                            slope: 1,
                            intercept: 0,
                            note: 'CO₂ → kg'
                        },
                        {
                            sourceName: 'kg',
                            destinationName: 'metric ton',
                            bidirectional: true,
                            slope: 1e-3,
                            intercept: 0,
                            note: 'kg → Metric ton'
                        },
                        {
                            sourceName: 'pound',
                            destinationName: 'metric ton',
                            bidirectional: true,
                            slope: 454.545454,
                            intercept: 0,
                            note: 'lbs → metric tons'
                        }
                    ];

                    const meterData = [
                        {
                            name: 'Electric_Utility pound of CO₂',
                            unit: 'Electric_Utility',
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
                    const unitId = await getUnitId('pound of CO₂');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_lbsCO2_st_-inf_et_inf.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });

                mocha.it('L21: should have hourly points for middle readings of 15 minute for a 60 day period and quantity units & kWh as MJ', async () => {
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
                    const meterData = [
                        {
                            name: 'Electric_Utility MJ',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'MJ',
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
                    const unitId = await getUnitId('MJ');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_2022-08-25%00#00#00_et_2022-10-24%00#00#00.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-08-25', '00:00:00', '2022-10-24', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
                mocha.it('L23: should have raw points for middle readings of 15 minute for a 14 day period and quantity units & kWh as MJ', async () => {
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
                    const meterData = [
                        {
                            name: 'Electric_Utility MJ',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'MJ',
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
                    const unitId = await getUnitId('MJ');
                    // Reuse same file as flow since value should be the same values.
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_line_ri_15_mu_kWh_gu_MJ_st_2022-09-21%00#00#00_et_2022-10-05%00#00#00.csv');

                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: createTimeString('2022-09-21', '00:00:00', '2022-10-05', '00:00:00'), graphicUnitId: unitId });
                    expectReadingToEqualExpected(res, expected)
                });
            });
        });
    });
});
