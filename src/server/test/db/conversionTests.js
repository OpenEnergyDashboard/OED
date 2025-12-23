/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;
const { mocha, expect, testDB } = require('../common');
const Conversion = require('../../models/Conversion');
const ConversionSegment = require('../../models/ConversionSegment');
const Unit = require('../../models/Unit');

/**
 * Compares the expected and actual conversions.
 * @param {*} expected The expected conversion.
 * @param {*} actual The actual conversion.
 */
function expectConversionToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('sourceId', expected.sourceId);
	expect(actual).to.have.property('destinationId', expected.destinationId);
	expect(actual).to.have.property('bidirectional', expected.bidirectional);
	expect(actual).to.have.property('note', expected.note);
}

/**
 * Compares the expected and actual conversion segments.
 * @param {*} expected The expected conversion.
 * @param {*} actual The actual conversion.
 */
function expectConversionSegmentToBeEquivalent(expected, actual) {
	// console.log('expected: ', expected);
	// console.log('actual: ', actual);
	expect(actual).to.have.property('sourceId', expected.sourceId);
	expect(actual).to.have.property('destinationId', expected.destinationId);
	expect(actual).to.have.property('weekPatternsId', expected.weekPatternsId);
	expect(actual).to.have.property('slope', expected.slope);
	expect(actual).to.have.property('intercept', expected.intercept);
	expect(actual).to.have.property('startTime', expected.startTime);
	expect(actual).to.have.property('endTime', expected.endTime);
	expect(actual).to.have.property('note', expected.note);
}

mocha.describe('Conversions', () => {
	let unitAId, unitBId, conversionSegmentPreInsert;
	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		const unitA = new Unit(undefined, 'Unit A', 'Unit A', Unit.unitRepresentType.QUANTITY, 1000,
			Unit.unitType.UNIT, 'Suffix A', Unit.displayableType.ADMIN, true, 'Note A');
		const unitB = new Unit(undefined, 'Unit B', 'Unit B', Unit.unitRepresentType.QUANTITY, 2000,
			Unit.unitType.METER, 'Suffix B', Unit.displayableType.ALL, true, 'Note B');
		await unitA.insert(conn);
		await unitB.insert(conn);
		unitAId = (await Unit.getByName('Unit A', conn)).id;
		unitBId = (await Unit.getByName('Unit B', conn)).id;
		conversionSegmentPreInsert = new ConversionSegment(unitAId, unitBId, null, 1.23, 3.14, '-infinity', 'infinity', 'Segment note');
	});

	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const conversionPreInsert = new Conversion(unitAId, unitBId, false, 'Note');
		await conversionPreInsert.insert(conversionSegmentPreInsert.weekPatternsId, conversionSegmentPreInsert.slope, conversionSegmentPreInsert.intercept, conversionSegmentPreInsert.note, conn);
		// Gets conversion by source and destination.
		const conversionPostInsert = await Conversion.getBySourceDestination(unitAId, unitBId, conn);
		expectConversionToBeEquivalent(conversionPreInsert, conversionPostInsert);
		// Gets conversion segment by source and destination.
		const conversionSegmentPostInsert = await ConversionSegment.getBySourceDestination(unitAId, unitBId, conn);
		expect(conversionSegmentPostInsert.length).to.equal(1);
		expectConversionSegmentToBeEquivalent(conversionSegmentPreInsert, conversionSegmentPostInsert[0]);
	});

	mocha.it('can be updated and retrieved', async () => {
		const conn = testDB.getConnection();
		const conversionPreInsert = new Conversion(unitAId, unitBId, true, 'Note');
		await conversionPreInsert.insert(conversionSegmentPreInsert.weekPatternsId, conversionSegmentPreInsert.slope, conversionSegmentPreInsert.intercept, conversionSegmentPreInsert.note, conn);
		// Updates the conversion. Note that the sourceId and destinationId can't be changed.
		conversionPreInsert.bidirectional = false;
		conversionPreInsert.note = 'New note';
		await conversionPreInsert.update(conn);
		// Checks conversion and segment.
		const conversionPostInsert = await Conversion.getBySourceDestination(unitAId, unitBId, conn);
		expectConversionToBeEquivalent(conversionPreInsert, conversionPostInsert);
		const conversionSegmentPostInsert = await ConversionSegment.getBySourceDestination(unitAId, unitBId, conn);
		// Conversion segment should not have been changed.
		expect(conversionSegmentPostInsert.length).to.equal(1);
		expectConversionSegmentToBeEquivalent(conversionSegmentPreInsert, conversionSegmentPostInsert[0]);
	});

	mocha.it('can be deleted', async () => {
		const conn = testDB.getConnection();
		const conversionPreInsert = new Conversion(unitAId, unitBId, true, 'Note');
		await conversionPreInsert.insert(conversionSegmentPreInsert.weekPatternsId, conversionSegmentPreInsert.slope, conversionSegmentPreInsert.intercept, conversionSegmentPreInsert.segmentNote, conn);
		// Remove the conversion segment created.
		await conn.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
			sourceId: conversionSegmentPreInsert.sourceId,
			destinationId: conversionSegmentPreInsert.destinationId,
			startTime: conversionSegmentPreInsert.startTime,
			endTime: conversionSegmentPreInsert.endTime
		});
		await Conversion.delete(unitAId, unitBId, conn);
		// Check that gone.
		const conversionPostInsert = await Conversion.getBySourceDestination(unitAId, unitBId, conn);
		expect(conversionPostInsert).to.be.equal(null);
	});
});
