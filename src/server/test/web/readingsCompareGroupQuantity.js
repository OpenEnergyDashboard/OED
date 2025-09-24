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
				mocha.it('CG3: 28 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as kWh ', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [189951.689612281, 190855.90449004];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-09 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P28D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});
				mocha.it('CG4: 1 day shift end 2022-11-01 00:00:00 (full day) for 15 minute reading intervals and quantity units & kWh as kWh', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [7820.41927336775, 8351.13117114892];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-11-01 00:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});

				mocha.it('CG5: 7 day shift end 2022-11-01 15:00:00 (beyond data) for 15 minute reading intervals and quantity units & kWh as kWh ', async () => {
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [16171.5504445167, 23010.8509932843];
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-30 00:00:00',
							curr_end: '2022-11-01 15:00:00',
							shift: 'P7D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});

				mocha.it('CG6: 28 day shift end 2022-10-31 17:12:34 (partial hour) for 15 minute reading intervals and quantity units & kWh as kWh', async () => { //test description
					await prepareTest(unitDatakWh, conversionDatakWh, meterDatakWhGroups, groupDatakWh); // prepare test environment
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('kWh');
					const expected = [189951.689612281, 190855.90449004]; // expected results
					// for compare, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-09 00:00:00',
							curr_end: '2022-10-31 17:12:34',
							shift: 'P28D',                    // 28-day shift
							graphicUnitId: unitId             // Unit ID for kWh
						});

					expectCompareToEqualExpected(res, expected, GROUP_ID); // confirm the results match with expected results
				});

				mocha.it('CG8: 1 day shift end 2022-10-31 17:00:00 for 15 minute reading intervals and quantity units & kWh as MJ', async () => {
					// Define unit u3 for MJ (megajoules)
					const u3 = {
						name: 'MJ',
						identifier: 'megaJoules',
						unitRepresent: Unit.unitRepresentType.QUANTITY,
						secInRate: 3600,
						typeOfUnit: Unit.unitType.UNIT, suffix: '',
						displayable: Unit.displayableType.ALL,
						preferredDisplay: false,
						note: 'MJ'
					}
					// Define conversion c2 for kWh to MJ
					const c2 = {
						sourceName: 'kWh',
						destinationName: 'MJ',
						bidirectional: true,
						slope: 3.6,
						intercept: 0,
						note: 'kWh → MJ'
					}
					await prepareTest(
						unitDatakWh.concat(u3), // Use units [u1, u2] + u3
						conversionDatakWh.concat(c2), // Use conversion [c1] + c2
						meterDatakWhGroups,
						groupDatakWh
					);
					// Get the unit ID since the DB could use any value.
					const unitId = await getUnitId('MJ');
					const expected = [20398.8705799196, 21140.7089140044];
					// for comparison, need the unitID, currentStart, currentEnd, shift
					const res = await chai.request(app).get(`/api/compareReadings/groups/${GROUP_ID}`)
						.query({
							curr_start: '2022-10-31 00:00:00',
							curr_end: '2022-10-31 17:00:00',
							shift: 'P1D',
							graphicUnitId: unitId
						});
					expectCompareToEqualExpected(res, expected, GROUP_ID);
				});

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
