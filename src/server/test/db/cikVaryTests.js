/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const { redoCikVary } = require('../../services/graph/redoCik');
const Conversion = require('../../models/Conversion');
const Unit = require('../../models/Unit');

// Insert test units for IDs 10, 1, 2
async function insertTestUnits(conn) {
	await new Unit(undefined, 'Unit 10', 'Unit 10', Unit.unitRepresentType.QUANTITY, 1000, Unit.unitType.UNIT, 'Suffix 10', Unit.displayableType.ADMIN, true, 'Note 10').insert(conn);
	await new Unit(undefined, 'Unit 1', 'Unit 1', Unit.unitRepresentType.QUANTITY, 1001, Unit.unitType.UNIT, 'Suffix 1', Unit.displayableType.ADMIN, true, 'Note 1').insert(conn);
	await new Unit(undefined, 'Unit 2', 'Unit 2', Unit.unitRepresentType.QUANTITY, 1002, Unit.unitType.UNIT, 'Suffix 2', Unit.displayableType.ADMIN, true, 'Note 2').insert(conn);
}

// Insert multiple segments for 10->1 and 1->2 into conversion_segments
async function insertTestSegments(conn) {
	// Segments for 10 -> 1
	const segs10_1 = [
		{ start: '2020-01-01 00:00:00', end: '2020-06-01 00:00:00', slope: 2, intercept: 0 },
		{ start: '2020-06-01 00:00:00', end: '2021-01-01 00:00:00', slope: 3, intercept: 1 }
	];
	for (const seg of segs10_1) {
		await conn.none(
			`INSERT INTO conversion_segments 
				(source_id, destination_id, week_patterns_id, slope, intercept, start_time, end_time, note)	
			VALUES ($1, $2, NULL, $3, $4, $5, $6, NULL)`,
			[10, 1, seg.slope, seg.intercept, seg.start, seg.end]
		);
		console.log(`Inserted into conversion_segments: (10, 1, ${seg.start}, ${seg.end}, ${seg.slope}, ${seg.intercept})`);
	}
	// Segments for 1 -> 2
	const segs1_2 = [
		{ start: '2020-01-01 00:00:00', end: '2020-06-01 00:00:00', slope: 4, intercept: 0 },
		{ start: '2020-06-01 00:00:00', end: '2021-01-01 00:00:00', slope: 5, intercept: 2 }
	];
	for (const seg of segs1_2) {
		await conn.none(
			`INSERT INTO conversion_segments 
				(source_id, destination_id, week_patterns_id, slope, intercept, start_time, end_time, note)
			VALUES ($1, $2, NULL, $3, $4, $5, $6, NULL)`,
			[1, 2, seg.slope, seg.intercept, seg.start, seg.end]
		);
		console.log(`Inserted into conversion_segments: (1, 2, ${seg.start}, ${seg.end}, ${seg.slope}, ${seg.intercept})`);
	}
}

// Insert test conversions using the Conversion class
async function insertTestConversions(conn) {
	const unit10Id = (await Unit.getByName('Unit 10', conn)).id;
	const unit1Id = (await Unit.getByName('Unit 1', conn)).id;
	const unit2Id = (await Unit.getByName('Unit 2', conn)).id;
	const conversionPreInsert1 = new Conversion(unit10Id, unit1Id, false, 1, 0, 'note');
	const conversionPreInsert2 = new Conversion(unit1Id, unit2Id, false, 1, 0, 'note');
	await Promise.all([
		conversionPreInsert1.insert(conn),
		conversionPreInsert2.insert(conn)
	]);
}

mocha.describe('CIK Vary Chaining', () => {

	mocha.describe('Insert test unit', function () {
		mocha.it('should insert units without error', async function () {
			this.timeout(5000);
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			const units = await conn.any('SELECT * FROM units');
			expect(units).to.have.lengthOf(3);
		});
	});
	mocha.describe('Insert test conversions', function () {
		mocha.it('should insert conversions without error', async function () {
			this.timeout(5000);
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			await insertTestConversions(conn);
			const conversions = await conn.any('SELECT * FROM conversions');
			expect(conversions).to.have.lengthOf(2);
		});
	});

	//mocha.describe('Insert test segments', () => {
	//	mocha.it('should insert segments without error', async () => {
	//		const conn = testDB.getConnection();
	//		await insertTestUnits(conn);
	//		await insertTestConversions(conn);
	//		await insertTestSegments(conn);
	//		const segments = await conn.any('SELECT * FROM conversion_segments');
	//		expect(segments).to.have.lengthOf(4);
	//	});
	//});

	mocha.describe('Update cik_vary and views', function () {
		mocha.it('should update cik_vary correctly', async function () {
			this.timeout(5000);
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			await insertTestConversions(conn);
			await insertTestSegments(conn);
			await redoCikVary(conn);
			const results = await conn.any('SELECT * FROM cik_vary ORDER BY source_id, destination_id, start_time');
			console.log('cik_vary results:', results);
			expect(results).to.be.an('array').that.is.not.empty;
		});
	});

});
