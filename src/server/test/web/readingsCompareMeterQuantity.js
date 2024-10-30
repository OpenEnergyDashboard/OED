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
	unitDatakWh,
	conversionDatakWh,
	meterDatakWh } = require('../../util/readingsUtils');

mocha.describe('readings API', () => {
	mocha.describe('readings test, test if data returned by API is as expected', () => {
		mocha.describe('for compare charts', () => {
			mocha.describe('for meters', () => {
				// Test 15 minutes over all time for flow unit.
				mocha.it('C1: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [3120.01835362067, 3367.50141893133];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C2: 7 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [7962.23097109771, 8230.447588312];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P7D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});

				mocha.it('C3: 28 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [108269.924822581, 108889.847659507];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/meters/${METER_ID}`)
						.query({
							curr_start: '2022-10-09 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P28D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected);
				});
				// Add C4 here

				// Add C5 here

				// Add C6 here

				// Add C8 here

				// Add C9 here

				// Add C10 here

				// Add C11 here

				// Add C12 here

				// Add C13 here

				// Add C14 here
			});
		});
	});
});
