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
    expectReadingToEqualExpected,
    getUnitId,
    ETERNITY,
    METER_ID,
    GROUP_ID } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for bar charts', () => {
            mocha.describe('for flow groups', () => {
                mocha.it('BG15: should have daily points for 15 + 20 minute reading intervals and flow units with +-inf start/end time & kW as kW', async () =>{
                    const unitDatakW = [
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
                        },
                    ];
                    const conversionDatakW = [
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
                    const meterDatakWGroups = [
                        {
                            name: 'meterDatakWGroups',
                            unit: 'Electric',
                            defaultGraphicUnit: 'kW',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        },
                        {
                            name: 'meterDatakWOther',
                            unit: 'Electric',
                            defaultGraphicUnit: 'kW',
                            displayable: true, 
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '20 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    const groupDatakW = [
                        {
                            id: GROUP_ID,
                            name: 'meterDatakWGroups + meterDatakWOther',
                            displayable: true,
                            note: 'special group',
                            defaultGraphicUnit: 'kW',
                            childMeters: ['meterDatakWGroups', 'meterDatakWOther'],
                            childGroups: [], 
                        }
                    ]
                    //load data into database
                    await prepareTest(unitDatakW, conversionDatakW, meterDatakWGroups, groupDatakW);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('kW');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_kW_gu_kW_st_-inf_et_inf_bd_13.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '13',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });

                mocha.it('BG16: should have daily points for 15 + 20 minute reading intervals and flow units with +-inf start/end time & thing as thing where rate is 36', async () => {
                    const unitDataThing = [
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
                    const conversionDataThing = [
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
                    const meterDataThingGroups = [
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
                        },
                        {
                            name: 'Thing_36 Other',
                            unit: 'Thing_36',
                            defaultGraphicUnit: 'thing unit',
                            displayable: true, 
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_20_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '20 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    const groupThing = [
                        {
                            id: GROUP_ID,
                            name: 'Thing_36 thing unit + Thing_36 Other',
                            displayable: true,
                            note: 'special group',
                            defaultGraphicUnit: 'thing unit',
                            childMeters: ['Thing_36 thing unit', 'Thing_36 Other'],
                            childGroups: [], 
                        }
                    ]
                    //load data into database
                    await prepareTest(unitDataThing, conversionDataThing, meterDataThingGroups, groupThing);
                    //get unit ID since the DB could use any value.
                    const unitId = await getUnitId('thing unit');
                    // Load the expected response data from the corresponding csv file
                    const expected = await parseExpectedCsv('src/server/test/web/readingsData/expected_bar_group_ri_15-20_mu_Thing36_gu_thing_st_-inf_et_inf_bd_13.csv');
                    // Create a request to the API for unbounded reading times and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({ 
                            timeInterval: ETERNITY.toString(), 
                            barWidthDays: '13',
                            graphicUnitId: unitId });
                    // Check that the API reading is equal to what it is expected to equal
                    expectReadingToEqualExpected(res, expected, GROUP_ID);
                });
            });
        });
    });
});
