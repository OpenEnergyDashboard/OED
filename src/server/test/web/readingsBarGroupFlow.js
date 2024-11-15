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

                // Add BG16 here

            });
        });
    });
});
