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
	GROUP_ID,
	unitDatakWh,
	conversionDatakWh,
	meterDatakWhGroups,
	groupDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for compare charts', () => {
			mocha.describe('for groups', () => {
				// Test 15 minutes over all time for flow unit.
				mocha.it('CG1: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh ', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [5666.35293886656, 5872.41914277899];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});
				mocha.it('CG2: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh ', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [14017.4841100155, 14605.4957015091];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P7D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});

				// Add CG3 here

				// Add CG4 here

				// Add CG5 here

				// Add CG6 here

				// Add CG8 here

				// Add CG9 here

				// Add CG10 here

				// Add CG11 here

				// Add CG12 here

				// Add CG13 here

				// Add CG14 here
			});
		});
	});
});
