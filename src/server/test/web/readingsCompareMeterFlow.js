/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
	This file tests the readings retrieval API compare chart meters.
	See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/
const { chai, mocha, app } = require('../common');
const Unit = require('../../models/Unit');
const { prepareTest,
	expectCompareToEqualExpected,
	getUnitId,
	METER_ID,
	unitDatakWh,
	conversionDatakWh,
	meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for compare charts', () => {
			mocha.describe('for meters', () => {
				// Add C15 here

				// C16 - Test 15 minute intervals and flow units and thing as "thing where rate is 36"
				mocha.it('C16: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and flow units & thing as thing where rate is 36', async () => {
					//Create a 2D array to feed into the database
					const unitDataThing = [
						{
                            // u14
                            name: 'Thing_36',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.FLOW,
                            secInRate: 36,
                            typeOfUnit: Unit.unitType.METER,
                            suffix: '',
                            displayable: Unit.displayableType.NONE,
                            preferredDisplay: false,
                            note: 'special unit'
                        },
                        {
                            // u15
                            name: 'thing unit',
                            identifier: '',
                            unitRepresent: Unit.unitRepresentType.FLOW,
                            secInRate: 3600,
                            typeOfUnit: Unit.unitType.UNIT,
                            suffix: '',
                            displayable: Unit.displayableType.ALL,
                            preferredDisplay: false,
                            note: 'special unit'
						}
					];

					const converstionDataThing_36 = [
						{
							// c15
							sourceName: 'Thing_36',
							destinationName: 'thing unit',
							bidirectional: false,
							//Our test case says slope is 100, but the definition in C15 is 1
							slope: 1,
							intercept: 0,
							note: 'Thing_36 → thing unit'
						}
					];

					const meterDataThing_36 = [
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
					]

					// Initialize test database with this data
					await prepareTest(unitDataThing, converstionDataThing_36, meterDataThing_36);

					// Get the unit ID since the DB could use any value
					const unitId = await getUnitId('thing unit');
					// Expected was taken from the `curr use, prev use` column for this test case, since this is a compare readings test
					const expected = [4855.01888481568, 5018.56560262927];

					// Create a request to the API and save the response
					// Note: the api paths are located in app.js, but our specific one points to compareReadings.js
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
					.query({
						curr_start: '2022-10-30 00:00:00',
						curr_end: '2022-10-31 17:00:00',
						shift: 'P7D',
						graphicUnitId: unitId
					});

					// Check that the API reading is equal to what it is expected to equal
					expectCompareToEqualExpected(res, expected, METER_ID);
				})
			});
		});
	});
});
