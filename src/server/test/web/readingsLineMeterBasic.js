/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
    This file tests the readings retrieval API basic function of line charts for meters.
    See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/

const { chai, mocha, expect, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
    getUnitId,
    ETERNITY,
    METER_ID,
    HTTP_CODE,
    unitDatakWh,
    conversionDatakWh,
    meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
    mocha.describe('readings test, test if data returned by API is as expected', () => {
        mocha.describe('for line charts', () => {
            mocha.describe('basic for meters', () => {
                 // A reading response should have a reading, startTimestamp, and endTimestamp key
                mocha.it('response should have valid reading and timestamps,', async () => {
                    // Load the data into the database
                    await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    // Create a request to the API and save the response
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    // unitReadings should return as json
                    expect(res).to.be.json;
                    // the route should not return a bad request
                    expect(res).to.have.status(HTTP_CODE.OK);
                    // Check if the first element returned by the API is the correct format
                    expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('reading');
                    expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('startTimestamp');
                    expect(res.body).to.have.property(`${METER_ID}`).to.have.property('0').to.have.property('endTimestamp');
                });
                // When an invalid unit is added to a meter and loaded to the db, the API should return an empty array
                mocha.it('should return an empty json object for an invalid unit', async () => {
                    const unitData = [
                        {
                            // u1 - do separately since don't want Electric Utility.
                            name: 'kWh',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: true,
                            note: 'OED created standard unit'
                        },
                        {
                            name: 'invalidUnit',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.QUANTITY,
                            secInRate: 1,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: true,
                            note: 'Invalid Unit'
                        }
                    ];
                    const conversionData = [
                        {
                            sourceName: 'invalidUnit',
                            destinationName: 'kWh',
                            bidirectional: false,
                            slope: 1,
                            intercept: 0,
                            note: 'invalidUnit → kWh'
                        }
                    ];
                    const meterData = [
                        {
                            name: 'Invalid',
                            unit: 'invalidUnit',
                            defaultGraphicUnit: 'kWh',
                            displayable: true,
                            gps: undefined,
                            note: 'invalid meter',
                            file: 'test/web/readingsData/readings_ri_15_days_75.csv',
                            deleteFile: false,
                            readingFrequency: '15 minutes',
                            id: METER_ID
                        }
                    ];
                    await prepareTest(unitData, conversionData, meterData);
                    // Get the unit ID since the DB could use any value.
                    const unitId = await getUnitId('kWh');
                    const res = await chai.request(app).get(`/api/unitReadings/line/meters/${METER_ID}`)
                        .query({ timeInterval: ETERNITY.toString(), graphicUnitId: unitId });
                    expect(res).to.be.json;
                    expect(res.body).to.have.property(`${METER_ID}`).to.be.empty;
                });
            });
        });
    });
});
