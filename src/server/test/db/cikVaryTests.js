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

// Insert test units for IDs 10, 1, 2
async function insertTestUnits(conn) {
	await new Unit(undefined, 'Unit 10', 'Unit 10', Unit.unitRepresentType.QUANTITY, 1000, Unit.unitType.METER, '', Unit.displayableType.ADMIN, true, 'Note 10').insert(conn);
	await new Unit(undefined, 'Unit 1', 'Unit 1', Unit.unitRepresentType.QUANTITY, 1001, Unit.unitType.UNIT, '', Unit.displayableType.ADMIN, true, 'Note 1').insert(conn);
	await new Unit(undefined, 'Unit 2', 'Unit 2', Unit.unitRepresentType.QUANTITY, 1002, Unit.unitType.UNIT, '', Unit.displayableType.ADMIN, true, 'Note 2').insert(conn);
}

// Insert multiple segments for 10->1 and 1->2 into conversion_segments
async function insertTestSegments(conn) {
	const unit10Id = (await Unit.getByName('Unit 10', conn)).id;
	const unit1Id = (await Unit.getByName('Unit 1', conn)).id;
	const unit2Id = (await Unit.getByName('Unit 2', conn)).id;

	// For 10 -> 1

	// Split at 2020-01-01 00:00:00
	await ConversionSegment.splitLater(
		unit10Id, unit1Id, null, 2, 0, null,
		'-infinity', 'infinity', '2020-01-01 00:00:00', conn
	);

	// Split at 2020-06-01 00:00:00 (on the segment starting at 2020-01-01)
	await ConversionSegment.splitLater(
		unit10Id, unit1Id, null, 3, 0, null,
		'2020-01-01 00:00:00', 'infinity', '2020-06-01 00:00:00', conn
	);

	// Split at 2021-01-01 00:00:00 (on the segment starting at 2020-06-01)
	//await ConversionSegment.splitLater(
	//	unit10Id, unit1Id, null, 4, 0, null,
	//	'2020-06-01 00:00:00', 'infinity', '2021-01-01 00:00:00', conn
	//);

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

// Insert test conversions using the Conversion class
async function insertTestConversions(conn) {
	const unit10Id = (await Unit.getByName('Unit 10', conn)).id;
	const unit1Id = (await Unit.getByName('Unit 1', conn)).id;
	const unit2Id = (await Unit.getByName('Unit 2', conn)).id;
	const conversionPreInsert1 = new Conversion(unit10Id, unit1Id, false, 'note');
	const conversionPreInsert2 = new Conversion(unit1Id, unit2Id, false, 'note');
	await Promise.all([
		conversionPreInsert1.insert(null, 1, 0, "", conn),
		conversionPreInsert2.insert(null, 1, 0, "notes", conn)
	]);
}

mocha.describe('CIK Vary Chaining', () => {

	mocha.describe('Insert test unit', function () {
		mocha.it('should insert units without error', async function () {
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			const units = await conn.any('SELECT * FROM units');
			expect(units).to.have.lengthOf(3);
		});
	});
	mocha.describe('Insert test conversions', function () {
		mocha.it('should insert conversions without error', async function () {
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			await insertTestConversions(conn);
			const conversions = await conn.any('SELECT * FROM conversions');
			expect(conversions).to.have.lengthOf(2);
		});
	});

	mocha.describe('Insert test segments', () => {
		mocha.it('should insert segments without error', async () => {
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			await insertTestConversions(conn);
			await insertTestSegments(conn);
			const segments = await conn.any('SELECT * FROM conversion_segments');
			expect(segments).to.have.lengthOf(7);
		});
	});

	mocha.describe('Update cik_vary and views', function () {
		mocha.it('should update cik_vary with the correct amount of segments', async function () {
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			await insertTestConversions(conn);
			await insertTestSegments(conn);
			await redoCikVary(conn);
			const results = await conn.any('SELECT * FROM cik_vary ORDER BY source_id, destination_id, start_time');

			expect(results).to.be.an('array').that.is.not.empty;
			expect(results).to.have.lengthOf(7);
		});

		
		mocha.it('should have correct slopes for each cik_vary segment', async function () {
			const conn = testDB.getConnection();
			await insertTestUnits(conn);
			await insertTestConversions(conn);
			await insertTestSegments(conn);
			await redoCikVary(conn);
			const results = await conn.any('SELECT * FROM cik_vary ORDER BY source_id, destination_id, start_time');

			// Define expected slopes for each segment, grouped by (source_id, destination_id)
			const expectedSlopes = {
				// Format: 'source_id->destination_id': [slope1, slope2, slope3, slope4]
				'1->2': [1, 2, 3],
				//1->2->3
				'1->3': [1, 12, 21, 24],
			};

			// Group results by (source_id, destination_id)
			const grouped = {};
			results.forEach(row => {
				const key = `${row.source_id}->${row.destination_id}`;
				if (!grouped[key]) grouped[key] = [];
				grouped[key].push(row.slope);
			});

			// Check each group matches expected slopes
			Object.entries(expectedSlopes).forEach(([key, slopes]) => {
				expect(grouped[key]).to.deep.equal(slopes);
			});
		});
	});

});
