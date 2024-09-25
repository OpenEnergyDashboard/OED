/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for charts quantity meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    parseExpectedCsv,
    //createTimeString,
    expectReadingToEqualExpected,
    getUnitId,
    ETERNITY,
    METER_ID,
    //unitDatakWh,
    //conversionDatakWh,
    //meterDatakWh 
    } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for bar charts', () => {
            mocha.describe('for flow meters', () => {

                mocha.it('B15: should have daily points for 15 minute reading intervals and flow units with +-inf start/end time & kW as kW', async () => {
                    const unitData = [
                        {
                            // u4
                            name: 'kW',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.FLOW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: true,
                            note: 'kilowatts'
                        },
                        {
                            // u5
                            name: 'Electric',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.FLOW,
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
                            // c4
                            sourceName: 'Electric',
                            destinationName: 'kW',
                            bidirectional: false,
                            slope: 1,
                            intercept: 0,
                            note: 'Electric → kW'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Electric kW',
                            unit: 'Electric',
                            defaultGraphicUnit: 'kW',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        }
                    ];
                    // Load the data into the database
                    await prepareTest(unitData, conversionData, meterData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kW');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_kW_gu_kW_st_-inf_et_inf_bd_13.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                        .query({
                            timeInterval: ETERNITY.toString(),
                            barWidthDays: 13,
                            graphicUnitId: unitId
                        });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected);
                });

                mocha.it('B16: should have daily points for 15 minute reading intervals and flow units with +-inf start/end time & thing as thing where rate is 36', async () => {
                    const unitData = [
                        {
                            // u14
                            name: "Thing_36",
                            identifier: "",
                            unitRepresent: Unit.unitRepresentType.FLOW,
                            secInRate: 36,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: "",
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: "special unit"
                        },
                        {
                            // u15
                            name: "thing unit",
                            identifier: "",
                            unitRepresent: Unit.unitRepresentType.FLOW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: "",
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: "special unit"
                         }
                    ];
                    const conversionData = [
                        {
                            // c15
                            sourceName: "Thing_36",
                            destinationName: "thing unit",
                            bidirectional: false,
                            slope: 1,
                            intercept: 0,
                            note: "Thing_36 → thing unit"
                         }
                    ];
                    const meterData = [
                        {
                            name: 'Thing_36 thing unit',
                            unit: 'Thing_36',
                            defaultGraphicUnit: 'thing unit',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        }
                    ];
                    // Load the data into the database
                    await prepareTest(unitData, conversionData, meterData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('thing unit');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_ri_15_mu_Thing36_gu_thing_st_-inf_et_inf_bd_13.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/meters/${METER_ID}`)
                        .query({
                            timeInterval: ETERNITY.toString(),
                            barWidthDays: 13,
                            graphicUnitId: unitId
                        });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected);
                });
            });
        });
    });
});
