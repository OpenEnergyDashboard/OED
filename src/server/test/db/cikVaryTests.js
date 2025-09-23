/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const { redoCikVary } = require('../../services/graph/redoCik');
const Conversion = require('../../models/Conversion');
const Unit = require('../../models/Unit');
const ConversionSegment = require('../../models/ConversionSegment');
const CikVary = require('../../models/CikVary');

async function setupTestData(conn) {
	await new Unit(undefined, 'Unit 10', 'Unit 10', Unit.unitRepresentType.QUANTITY, 1000, Unit.unitType.METER, '', Unit.displayableType.ADMIN, true, 'Note 10').insert(conn);
	await new Unit(undefined, 'Unit 1', 'Unit 1', Unit.unitRepresentType.QUANTITY, 1001, Unit.unitType.UNIT, '', Unit.displayableType.ADMIN, true, 'Note 1').insert(conn);
	await new Unit(undefined, 'Unit 2', 'Unit 2', Unit.unitRepresentType.QUANTITY, 1002, Unit.unitType.UNIT, '', Unit.displayableType.ADMIN, true, 'Note 2').insert(conn);

	const unit10Id = (await Unit.getByName('Unit 10', conn)).id;
	const unit1Id = (await Unit.getByName('Unit 1', conn)).id;
	const unit2Id = (await Unit.getByName('Unit 2', conn)).id;

	await new Conversion(unit10Id, unit1Id, false, 'note').insert(null, 1, 0, "", conn);
	await new Conversion(unit1Id, unit2Id, false, 'note').insert(null, 1, 0, "notes", conn);
	//	Test Setup:
	//- Unit 10 (meter unit) -> Unit 1 -> Unit 2 (conversion path)
	//- Each edge has time-varying conversion segments with different slopes
	//  
	//	Original Conversion Segments:
	//	Unit 10 -> Unit 1:
	//	[-∞, 2020-01-01): slope = 1, intercept = 0
	//	[2020-01-01, 2020-06-01): slope = 2, intercept = 0
	//	[2020-06-01, ∞): slope = 3, intercept = 0
	//
	//	Unit 1 -> Unit 2:
	//	[-∞, 2020-01-01): slope = 1, intercept = 0
	//	[2020-01-01, 2020-06-01): slope = 6, intercept = 0
	//	[2020-06-01, 2021-06-01): slope = 7, intercept = 0
	// 	[2021-06-01, ∞): slope = 8, intercept = 0
	//
	// Expected CikVary segments after redoCikVary:
	// - For Unit 10 -> Unit 1:
	//   [-∞, 2020-01-01): slope = 1= 1
	//   [2020-01-01, 2020-06-01): slope = 2 = 2
	//   [2020-06-01, ∞): slope = 3 = 3

	// - For Unit 10 -> Unit 1 -> Unit 2:
	//   [-∞, 2020-01-01): slope = 1*1 = 1
	//   [2020-01-01, 2020-06-01): slope = 2*6 = 12
	//   [2020-06-01, 2021-01-01): slope = 3*7 = 21
	//   [2021-06-01, ∞): slope = 3*8 = 24

	//For unit10 to unit1
	await ConversionSegment.splitLater(
		unit10Id, unit1Id, null, 2, 0, null,
		'-infinity', 'infinity', '2020-01-01 00:00:00', conn
	);

	await ConversionSegment.splitLater(
		unit10Id, unit1Id, null, 3, 0, null,
		'2020-01-01 00:00:00', 'infinity', '2020-06-01 00:00:00', conn
	);
	// For unit1 to unit2
	await ConversionSegment.splitLater(
		unit1Id, unit2Id, null, 6, 0, null,
		'-infinity', 'infinity', '2020-01-01 00:00:00', conn
	);
	await ConversionSegment.splitLater(
		unit1Id, unit2Id, null, 7, 0, null,
		'2020-01-01 00:00:00', 'infinity', '2020-06-01 00:00:00', conn
	);
	await ConversionSegment.splitLater(
		unit1Id, unit2Id, null, 8, 0, null,
		'2020-06-01 00:00:00', 'infinity', '2021-01-01 00:00:00', conn
	);
}

mocha.describe('redoCikVary integration', function () {
	let conn;
	mocha.beforeEach(async function () {
		conn = testDB.getConnection();
		await setupTestData(conn);

		// Fetch and store the actual IDs
		unit10Id = (await Unit.getByName('Unit 10', conn)).id;
		unit1Id = (await Unit.getByName('Unit 1', conn)).id;
		unit2Id = (await Unit.getByName('Unit 2', conn)).id;
	});

	mocha.it('should populate cik_vary with correct number of segments', async function () {
		await redoCikVary(conn);
		const results = await CikVary.getAll(conn);
		expect(results).to.be.an('array').that.is.not.empty;
		expect(results).to.have.lengthOf(7);
	});

	mocha.it('should have correct slopes for each cik_vary segment', async function () {
		await redoCikVary(conn);
		const results = await CikVary.getAll(conn);
		const expectedSlopes = {
			[`${unit10Id}->${unit1Id}`]: [1, 2, 3],
			[`${unit10Id}->${unit2Id}`]: [1, 12, 21, 24]
		};
		const grouped = {};
		results.forEach(row => {
			const key = `${row.meterUnitId}->${row.nonMeterUnitId}`;
			if (!grouped[key]) {
				grouped[key] = [];
			}
			// TODO: This test assumes segments are returned in chronological order by start time.
			// Should be updated to sort by start_time to be more robust.
			grouped[key].push(row.slope);
		});
		Object.entries(expectedSlopes).forEach(([key, slopes]) => {
			expect(grouped[key]).to.deep.equal(slopes);
		});
	});
});
