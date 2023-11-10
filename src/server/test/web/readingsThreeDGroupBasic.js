/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API basic function of 3D charts for groups.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, expect, app } = require('../common');
const { prepareTest,
    createTimeString,
    getUnitId,
    ETERNITY,
    GROUP_ID,
    HTTP_CODE,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWhGroups,
    groupDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for 3D charts', () => {
            mocha.describe('basic for groups', () => {
                mocha.it('response should be invalid if unbounded time', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Hours per reading returned.
                    const timePerReading = 1;
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId, readingInterval: timePerReading });
                    // the route should return a bad request
                    expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
                });
                mocha.it('response should be invalid if just over 1 year time', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Hours per reading returned.
                    const timePerReading = 1;
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({ timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-02', '00:00:00'), graphicUnitId: unitId, readingInterval: timePerReading });
                    // the route should return a bad request
                    expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
                });
                mocha.it('response should be valid if just 1 year time', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Hours per reading returned.
                    const timePerReading = 1;
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({ timeInterval: createTimeString('2022-01-01', '00:00:00', '2023-01-01', '00:00:00'), graphicUnitId: unitId, readingInterval: timePerReading });
                    // unitReadings should return as json
                    expect(res).to.be.json;
                    // the route should return an ok request
                    expect(res).to.have.status(HTTP_CODE.OK);
                    // Check if has the expected properties.
                    expect(res.body).to.have.property('xData');
                    expect(res.body).to.have.property('yData');
                    expect(res.body).to.have.property('zData');
                });
                mocha.it('15 minute readings, 3 hours/reading, less than 1 day and quantity units of kWh as kWh', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Hours per reading returned.
                    const timePerReading = 3;
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/threeD/groups/${GROUP_ID}`)
                        .query({
                            // Should not do a day that is almost full.
                            timeInterval: createTimeString('2022-09-13', '00:00:01', '2022-09-14', '23:59:59'),
                            graphicUnitId: unitId, readingInterval: timePerReading
                        });
                    // expectThreeDReadingToEqualExpected not designed to handle no return data so test this specially.
                    expect(res).to.be.json;
                    expect(res).to.have.status(HTTP_CODE.OK);
                    // Did the response have the correct type of properties.
                    expect(res.body).to.have.property('xData');
                    expect(res.body).to.have.property('yData');
                    // The lengths should be correct.
                    expect(res.body, 'xData length').to.have.property(`xData`).to.have.lengthOf(0);
                    expect(res.body, 'yData length').to.have.property(`yData`).to.have.lengthOf(0);
                    expect(res.body, 'zData length').to.have.property(`zData`).to.have.lengthOf(0);
                });
            });
        });
    });
});
