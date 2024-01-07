/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API function of 3D charts for quantity groups.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    expectThreeDReadingToEqualExpected,
    createTimeString,
    getUnitId,
    METER_ID,
    GROUP_ID,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWhGroups,
    groupDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for 3D charts', () => {
            mocha.describe('for quantity groups', () => {
                // Test all the allowed hours per reading which are the divisors of 24 but not 24.
                const allowedTimePerReading = [1, 2, 3, 4, 6, 8, 12];
                // test ID.
                const testId = ["3DG1", "3DG2", "3DG3", "3DG4", "3DG5", "3DG6", "3DG7"]
                for (let currentTimePerReadingIndex = 0; currentTimePerReadingIndex < allowedTimePerReading.length; currentTimePerReadingIndex++) {
                    const currentTimePerReading = allowedTimePerReading[currentTimePerReadingIndex];
                    mocha.it(`${testId[currentTimePerReadingIndex]}: 15 + 20 readings, ${currentTimePerReading} hours/point, full time range and quantity units of kWh as kWh`, async () => {
                        // Load the data into the database
                        await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                        // Get the unit ID since the DB could use any value.
                        const unitId = await getUnitId('kWh');
                        // Load and parse the corresponding expected values from csv
                        const expected = await parseExpectedCsv(
                            `src/server/test/web/readingsData/expected_3d_group_hp_${currentTimePerReading}_ri_15-20_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv`);
                        // Create a request to the API and save the response
                        const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                            .query({
                                timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
                                graphicUnitId: unitId, readingInterval: currentTimePerReading
                            });
                        expectThreeDReadingToEqualExpected(res, expected, currentTimePerReading);
                    });
                }
                mocha.it('3DG8: 15 + 20 readings, 3 hours/point, partial time range and quantity units of kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Hours per reading returned.
                    const timePerReading = 3;
                    // Load and parse the corresponding expected values from csv.
                    const expected = await parseExpectedCsv(
                        'src/server/test/web/readingsData/expected_3d_group_hp_3_ri_15-20_mu_kWh_gu_kWh_st_2022-09-19%00#00#00_et_2022-09-23%00#00#00.csv');
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({
                            // Should not do a day that is almost full.
                            timeInterval: createTimeString('2022-09-18', '00:00:01', '2022-09-23', '23:59:59'),
                            graphicUnitId: unitId, readingInterval: timePerReading
                        });
                    expectThreeDReadingToEqualExpected(res, expected, timePerReading);
                });
                mocha.it('3DG9: 15 + 20 readings, 4 hours/point, full time range and quantity units of kWh as BTU', async () => {
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
                    // Load the data into the database
                    await prepareTest(unitData, conversionData, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('BTU');
                    // Hours per reading returned.
                    const timePerReading = 4;
                    // Load and parse the corresponding expected values from csv.
                    const expected = await parseExpectedCsv(
                        'src/server/test/web/readingsData/expected_3d_group_hp_4_ri_15-20_mu_kWh_gu_BTU_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({
                            timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
                            graphicUnitId: unitId, readingInterval: timePerReading
                        });
                    expectThreeDReadingToEqualExpected(res, expected, timePerReading);
                });
                mocha.it('3DG10: 4 & 6 hour readings, 3 hours/point returns 4, full time range and quantity units of kWh as kWh', async () => {
                    const meterData = [
                        {
                            name: 'Electric Utility kWh',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            // Make it 4 hours but ok since using hour table.
                            readingFrequency: '4 hours',
                            id: METER_ID
                        },
                        {
                            name: 'Electric Utility Other',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            // Make it 6 hours but ok since using hour table.
                            readingFrequency: '6 hours',
                            id: (METER_ID + 1)
                        }
                    ];
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load and parse the corresponding expected values from csv. 4 hours not 3.
                    const expected = await parseExpectedCsv(
                        'src/server/test/web/readingsData/expected_3d_group_hp_4_ri_15-20_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00.csv');
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({
                            timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
                            graphicUnitId: unitId, readingInterval: 3
                        });
                    expectThreeDReadingToEqualExpected(res, expected, 4);
                });
                mocha.it('3DG11: 12.5 hour readings, 12 hours/point returns none, full time range and quantity units of kWh as kWh', async () => {
                    const meterData = [
                        {
                            name: 'Electric Utility kWh',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            // Make it a way too big.
                            readingFrequency: '4 days',
                            id: METER_ID
                        },
                        {
                            name: 'Electric Utility Other',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            // Make it a little too big.
                            readingFrequency: '12.5 hours',
                            id: (METER_ID + 1)
                        }
                    ];
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Load and parse the corresponding expected values from csv. 4 hours not 3.
                    const expected = await parseExpectedCsv(
                        'src/server/test/web/readingsData/expected_3d_groupFrequencyTooLong.csv');
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({
                            timeInterval: createTimeString('2022-08-18', '00:00:00', '2022-11-01', '00:00:00'),
                            graphicUnitId: unitId, readingInterval: 12
                        });
                    // Use 24 for timePerReading since unusual return data.
                    expectThreeDReadingToEqualExpected(res, expected, 24, true);
                });
                mocha.it('3DG12: 15 + 20 minute readings, 8 hours/point with holes, extended time range and quantity units of kWh as kWh', async () => {
                    const meterData = [
                        {
                            name: 'Electric Utility kWh',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75_holes.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        },
                        {
                            name: 'Electric Utility Other',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75_holes.csv',
                            deleteFile: false,
                            readingFrequency: '20 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Hours per reading returned.
                    const timePerReading = 8;
                    // Load and parse the corresponding expected values from csv.
                    const expected = await parseExpectedCsv(
                        'src/server/test/web/readingsData/expected_3d_group_hp_8_ri_15-20_mu_kWh_gu_kWh_st_2022-08-18%00#00#00_et_2022-11-01%00#00#00_holes.csv');
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({
                            // Going beyond dates to show no return for those.
                            timeInterval: createTimeString('2022-08-03', '00:00:00', '2022-11-11', '00:00:00'),
                            graphicUnitId: unitId, readingInterval: timePerReading
                        });
                    expectThreeDReadingToEqualExpected(res, expected, timePerReading);
                });
            });
        });
    });
});
