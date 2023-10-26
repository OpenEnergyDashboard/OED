/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API for basic function of bar charts for groups.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, expect, app } = require('../common');
const { prepareTest,
    getUnitId,
    ETERNITY,
    METER_ID,
    GROUP_ID,
    HTTP_CODE,
    unitDatakWh,
    conversionDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for bar charts', () => {
            mocha.describe('basic for groups', () => {
                mocha.it('response should have a valid reading, startTimestamp, and endTimestamp', async () => {
                    // Create 2D array for meter to feed into the database
                    // Note the meter ID is set so we know what to expect when a query is made.
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
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        },
                        {
                            name: 'Electric Utility kWh 2-6',
                            unit: 'Electric_Utility',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'special meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: (METER_ID + 1)
                        }
                    ];
                    const groupData = [['Electric Utility 1-5 + 2-6 kWh', 'kWh', true, undefined, 'special group', ['Electric Utility kWh', 'Electric Utility kWh 2-6'], [], GROUP_ID]];
                    await prepareTest(unitDatakWh, conversionDatakWh, meterData, groupData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const res = await chai.request(app).get(`/api/unitReadings/bar/groups/${GROUP_ID}`)
                        .query({
                            timeInterval: ETERNITY.toString(),
                            barWidthDays: 1,
                            graphicUnitId: unitId
                        });
                    expect(res).to.be.json;
                    expect(res).to.have.status(HTTP_CODE.OK);
                    expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('reading');
                    expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('startTimestamp');
                    expect(res.body).to.have.property(`${GROUP_ID}`).to.have.property('0').to.have.property('endTimestamp');
                });
            });
        });
    });
});
