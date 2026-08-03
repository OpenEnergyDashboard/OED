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
const TimeScaleDBReading = require('../../models/TimeScaleDB/Reading');
const refreshAllReadingViews = require('../../services/refreshAllReadingViews');
const sinon = require('sinon');

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

	mocha.it('should require a reading aggregate rebuild after replacing cik_vary', async function () {
		await redoCikVary(conn);

		const state = await conn.one(`
			SELECT rebuild_revision, completed_rebuild_revision
			FROM reading_aggregate_state
			WHERE id = 1
		`);
		expect(Number(state.rebuild_revision)).to.be.greaterThan(Number(state.completed_rebuild_revision));
	});

	mocha.it('should complete a pending rebuild during a default refresh', async function () {
		await redoCikVary(conn);
		await refreshAllReadingViews();

		const state = await conn.one(`
			SELECT rebuild_revision, completed_rebuild_revision
			FROM reading_aggregate_state
			WHERE id = 1
		`);
		expect(state.completed_rebuild_revision).to.equal(state.rebuild_revision);
	});

	mocha.it('should complete pending group cache maintenance during a default refresh', async function () {
		await redoCikVary(conn);
		await refreshAllReadingViews();

		const state = await conn.one(`
			SELECT group_cache_revision, completed_group_cache_revision
			FROM reading_aggregate_state
			WHERE id = 1
		`);
		expect(state.completed_group_cache_revision).to.equal(state.group_cache_revision);
	});

	mocha.it('should align hourly and daily refreshes to their own bucket boundaries', function () {
		const startTimestamp = '2022-08-18 10:15:00';
		const endTimestamp = '2022-08-18 11:45:00';
		const hourlyRange = TimeScaleDBReading.getRefreshRange(startTimestamp, endTimestamp, 'hour');
		const dailyRange = TimeScaleDBReading.getRefreshRange(startTimestamp, endTimestamp, 'day');

		expect(hourlyRange.refreshStart.toISOString()).to.equal('2022-08-18T10:00:00.000Z');
		expect(hourlyRange.refreshEnd.toISOString()).to.equal('2022-08-18T12:00:00.000Z');
		expect(dailyRange.refreshStart.toISOString()).to.equal('2022-08-18T00:00:00.000Z');
		expect(dailyRange.refreshEnd.toISOString()).to.equal('2022-08-19T00:00:00.000Z');
	});

	mocha.it('should require a rebuild after changing split-row unit metadata', async function () {
		await conn.none(`
			UPDATE units
			SET sec_in_rate = sec_in_rate + 1
			WHERE id = \${unitId}
		`, { unitId: unit10Id });

		const state = await conn.one(`
			SELECT rebuild_revision, completed_rebuild_revision
			FROM reading_aggregate_state
			WHERE id = 1
		`);
		expect(Number(state.rebuild_revision)).to.be.greaterThan(Number(state.completed_rebuild_revision));
	});

	mocha.it('should not rebuild by default when split-row sources are current', async function () {
		const rebuildSpy = sinon.spy(TimeScaleDBReading, 'rebuildReadings');
		try {
			await refreshAllReadingViews();
			expect(rebuildSpy.called).to.equal(false);
		} finally {
			rebuildSpy.restore();
		}
	});
});
