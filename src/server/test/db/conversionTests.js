/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const Conversion = require('../../models/Conversion');
const Unit = require('../../models/Unit');

/**
 * Compares the expected and actual conversions.
 * @param {*} expected The exepected conversion.
 * @param {*} actual The actual conversion.
 */
function expectConversionToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('sourceId', expected.sourceId);
	expect(actual).to.have.property('destinationId', expected.destinationId);
	expect(actual).to.have.property('bidirectional', expected.bidirectional);
	expect(actual).to.have.property('slope', expected.slope);
	expect(actual).to.have.property('intercept', expected.intercept);
	expect(actual).to.have.property('note', expected.note);
}

mocha.describe('Conversions', () => {
	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		const unitA = new Unit(undefined, 'Unit A', 'Unit A', Unit.unitRepresentType.UNUSED, 1000, 
								Unit.unitType.UNIT, 1, 'Suffix A', Unit.displayableType.ADMIN, true, 'Note A');
		const unitB = new Unit(undefined, 'Unit B', 'Unit B', Unit.unitRepresentType.UNUSED, 2000, 
								Unit.unitType.METER, 1, 'Suffix B', Unit.displayableType.ALL, true, 'Note B');
		await unitA.insert(conn);
		await unitB.insert(conn);
	});
	
	mocha.it('can be saved and retrived', async () => {
		const conn = testDB.getConnection();
		const unitAId = (await Unit.getByName('Unit A', conn)).id;
		const unitBId = (await Unit.getByName('Unit B', conn)).id;
		const conversionPreInsert = new Conversion(unitAId, unitBId, false, 1.23, 4.56, 'Note');
		await conversionPreInsert.insert(conn);
		// Gets conversion by source and destination.
		const conversionPostInsertBySourceDestination = await Conversion.getBySourceDestination(unitAId, unitBId, conn);
		expectConversionToBeEquivalent(conversionPreInsert, conversionPostInsertBySourceDestination);
	});

	mocha.it('can be updated and retrived', async () => {
		const conn = testDB.getConnection();
		const unitAId = (await Unit.getByName('Unit A', conn)).id;
		const unitBId = (await Unit.getByName('Unit B', conn)).id;
		const conversionPreInsert = new Conversion(unitAId, unitBId, true, 1.23, 4.56, 'Note');
		await conversionPreInsert.insert(conn);
		
		// Updates the conversion. Note that the sourceId and destinationId can't be changed.
		conversionPreInsert.bidirectional = false;
		conversionPreInsert.intercept = 3.14;
		conversionPreInsert.note = 'New note';
		await conversionPreInsert.update(conn);
		
		const covnersionPostInsert = await Conversion.getBySourceDestination(unitAId, unitBId, conn);
		expectConversionToBeEquivalent(conversionPreInsert, covnersionPostInsert); 
	});

	mocha.it('can be deleted', async () => {
		const conn = testDB.getConnection();
		const unitAId = (await Unit.getByName('Unit A', conn)).id;
		const unitBId = (await Unit.getByName('Unit B', conn)).id;
		const conversionPreInsert = new Conversion(unitAId, unitBId, true, 1.23, 4.56, 'Note');
		await conversionPreInsert.insert(conn);
		await Conversion.delete(unitAId, unitBId, conn);

		const conversionPostInsert = await Conversion.getBySourceDestination(unitAId, unitBId, conn);
		expect(conversionPostInsert).to.be.equal(null);
	});
});