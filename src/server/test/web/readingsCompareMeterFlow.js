/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
	This file tests the readings retrieval API compare chart meters.
	See: https://github.com/OpenEnergyDashboard/DesignDocs/blob/main/testing/testing.md for information.
*/
const { chai, mocha, app } = require('../common');
const { prepareTest,
	expectCompareToEqualExpected,
	getUnitId,
	METER_ID,
	unitDataThing,
	conversionDataThing_36,
	meterDataThing_36 } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for compare charts', () => {
			mocha.describe('for meters', () => {
				// Add C15 here

				mocha.it('C16: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and flow units & thing as thing where rate is 36', async () => {
					// Initialize test database with "thing" data
					await prepareTest(unitDataThing, conversionDataThing_36, meterDataThing_36);

					// Get the unit ID since the DB could use any value
					const unitId = await getUnitId('thing unit');
					// Expected was taken from the `curr use, prev use` column for this test case, since this is a compare readings test
					const expected = [7962.23097109771, 8230.447588311996];

					// Create a request to the API and save the response
					// Note: the api paths are located in app.js, but this specific one points to compareReadings.js
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
