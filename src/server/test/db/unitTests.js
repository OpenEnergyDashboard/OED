/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const Unit = require('../../models/Unit');

/**
 * Compares the expected and actual units.
 * @param {*} expected The expected unit.
 * @param {*} actual The actual unit.
 */
function expectUnitToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('name', expected.name);
	expect(actual).to.have.property('identifier', expected.identifier);
	expect(actual).to.have.property('unitRepresent', expected.unitRepresent);
	expect(actual).to.have.property('secInRate', expected.secInRate);
	expect(actual).to.have.property('typeOfUnit', expected.typeOfUnit);
	expect(actual).to.have.property('unitIndex', expected.unitIndex);
	expect(actual).to.have.property('suffix', expected.suffix);
	expect(actual).to.have.property('displayable', expected.displayable);
	expect(actual).to.have.property('alwaysDisplay', expected.alwaysDisplay);
	expect(actual).to.have.property('note', expected.note);
}

/**
 * Compares the expected and actual lists of units.
 * @param {*} expected The expected list of unit.
 * @param {*} actual The actual list of unit.
 */
function expectArrayOfUnitsToBeEquivalen(expected, actual) {
	expect(expected.length).to.be.equal(actual.length);
	// Need to sort before comparing.
	expected.sort(function (a, b) {
		return a.id - b.id;
	});
	actual.sort(function (a, b) {
		return a.id - b.id;
	});

	for (let i = 0; i < expected.length; ++i) {
		expectUnitToBeEquivalent(expected[i], actual[i]);
	}
}

mocha.describe('Units', () => {
	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const unitTypePreInsert = new Unit(undefined, 'Unit', 'Index', Unit.unitRepresentType.UNUSED, 
											1000, Unit.unitType.UNIT, 5, 'Suffix', Unit.displayableType.ALL, true, 'Note');
		await unitTypePreInsert.insert(conn);
		// Gets unit by id.
		const unitTypePostInsertById = await Unit.getById(1, conn);
		expectUnitToBeEquivalent(unitTypePreInsert, unitTypePostInsertById);
		// Gets unit by name.
		const unitTypePostInsertByName = await Unit.getByName('Unit', conn);
		expectUnitToBeEquivalent(unitTypePreInsert, unitTypePostInsertByName);
		// Gets unit by index.
		const idUnitTypePostInsertByIdentifier = await Unit.getByUnitIndexUnit(5, conn);
		expect(idUnitTypePostInsertByIdentifier).to.be.equal(1);
	});

	mocha.it('meter type can be retrieved by unitIndex', async () => {
		const conn = testDB.getConnection();
		const meterTypePreInsert = new Unit(undefined, 'Meter', 'Meter Id', Unit.unitRepresentType.UNUSED, 
											1000, Unit.unitType.METER, 5, 'Suffix', Unit.displayableType.ALL, true, 'Note');
		await meterTypePreInsert.insert(conn);
		const idMeterTypePostInsertByIdentifier = await Unit.getByUnitIndexMeter(5, conn);
		expect(idMeterTypePostInsertByIdentifier).to.be.equal(1);
	});

	mocha.it('can be saved, edited, and retrieved', async () => {
		const conn = testDB.getConnection();
		const unitPreInsert = new Unit(undefined, 'Unit', 'Unit Id', Unit.unitRepresentType.UNUSED, 
										1000, Unit.unitType.UNIT, 5, 'Suffix', Unit.displayableType.ALL, true, 'Note');
		await unitPreInsert.insert(conn);
		const unitPostInsert = await Unit.getById(1, conn);
		// Edits the unit.
		unitPostInsert.name = 'New name';
		unitPostInsert.typeOfUnit = Unit.unitType.METER;
		unitPostInsert.displayableType = Unit.displayableType.ADMIN;
		unitPostInsert.secInRate = 2000;
		await unitPostInsert.update(conn);
		// Gets the updated unit.
		const unitPostUpdate = await Unit.getById(1, conn);
		expectUnitToBeEquivalent(unitPostInsert, unitPostUpdate);
	});

	mocha.it('can get visible unit of type meter', async () => {
		const conn = testDB.getConnection();
		const unitTypeUnit = new Unit(undefined, 'Unit', 'Unit Id', Unit.unitRepresentType.UNUSED, 1000, 
										Unit.unitType.UNIT, 1, 'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note');
		const unitTypeMeterAll = new Unit(undefined, 'Meter All', 'Meter All Id', Unit.unitRepresentType.UNUSED, 2000, 
											Unit.unitType.METER, 2, 'Meter All Suffix', Unit.displayableType.ALL, true, 'Meter All Note');
		const unitTypeMeterAdmin = new Unit(undefined, 'Meter Admin', 'Meter Admin Id', Unit.unitRepresentType.UNUSED, 3000, 
											Unit.unitType.METER, 3, 'Meter Admin Suffix', Unit.displayableType.ADMIN, true, 'Meter Admin Note');

		await unitTypeUnit.insert(conn);
		await unitTypeMeterAdmin.insert(conn);
		await unitTypeMeterAll.insert(conn);
		// If user is admin then return units with displayableType.admin or displayableType.all
		const expectedUnitsForAdmin = [unitTypeMeterAll, unitTypeMeterAdmin];
		const actualUnitsForAdmin = await Unit.getVisibleMeter('admin', conn);
		expectArrayOfUnitsToBeEquivalen(expectedUnitsForAdmin, actualUnitsForAdmin)
		// If user is all then return units with displayableType.all
		const expectedUnitsForAll = [unitTypeMeterAll];
		const actualUnitsForAll = await Unit.getVisibleMeter('all', conn);
		expectArrayOfUnitsToBeEquivalen(expectedUnitsForAll, actualUnitsForAll);
	});

	mocha.it('can get visible unit of type unit or suffix', async () => {
		const conn = testDB.getConnection();
		const unitTypeMeter = new Unit(undefined, 'Meter', 'Meter Id', Unit.unitRepresentType.UNUSED, 1000, 
										Unit.unitType.METER, 1, 'Meter Suffix', Unit.displayableType.ALL, true, 'Meter Note');
		const unitTypeUnitAll = new Unit(undefined, 'Unit All', 'Unit All Id', Unit.unitRepresentType.UNUSED, 2000, 
										Unit.unitType.UNIT, 2, 'Unit All Suffix', Unit.displayableType.ALL, true, 'Unit All Note');
		const unitTypeUnitAdmin = new Unit(undefined, 'Unit Admin', 'Unit Admin Id', Unit.unitRepresentType.UNUSED, 3000, 
											Unit.unitType.UNIT, 3, 'Unit Admin Suffix', Unit.displayableType.ADMIN, true, 'Unit Admin Note');
		const unitTypeSuffixAll = new Unit(undefined, 'Suffix All', 'Suffix All Id', Unit.unitRepresentType.UNUSED, 4000, 
											Unit.unitType.SUFFIX, 4, 'Suffix All Suffix', Unit.displayableType.ALL, true, 'Suffix All Note');
		const unitTypeSuffixNone = new Unit(undefined, 'Suffix None', 'Suffix None Id', Unit.unitRepresentType.UNUSED, 5000, 
											Unit.unitType.SUFFIX, 5, 'Suffix None Suffix', Unit.displayableType.NONE, true, 'Suffix None Note');
		await unitTypeMeter.insert(conn);
		await unitTypeUnitAll.insert(conn);
		await unitTypeUnitAdmin.insert(conn);
		await unitTypeSuffixNone.insert(conn);
		await unitTypeSuffixAll.insert(conn);
		// If user is admin then return units with displayableType.admin or displayableType.all
		const expectedUnitForAdmin = [unitTypeUnitAdmin, unitTypeSuffixAll, unitTypeUnitAll];
		const actualUnitsForAdmin = await Unit.getVisibleUnitOrSuffix('admin', conn);
		expectArrayOfUnitsToBeEquivalen(expectedUnitForAdmin, actualUnitsForAdmin);
		// If user is all then return units with displayableType.all
		const expectedUnitsForAll = [unitTypeSuffixAll, unitTypeUnitAll];
		const actualUnitsForAll = await Unit.getVisibleUnitOrSuffix('all', conn);
		expectArrayOfUnitsToBeEquivalen(expectedUnitsForAll, actualUnitsForAll);
	});

	mocha.it('should only get units of type meter', async () => {
		const conn = testDB.getConnection();
		const unitTypeUnit = new Unit(undefined, 'Unit', 'Unit', Unit.unitRepresentType.UNUSED, 1000, 
										Unit.unitType.UNIT, 1, 'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note');
		const unitTypeMeterAll = new Unit(undefined, 'Meter All', 'Meter All', Unit.unitRepresentType.UNUSED, 2000, 
											Unit.unitType.METER, 2, 'Meter All Suffix', Unit.displayableType.ALL, true, 'Meter All Note');
		const unitTypeMeterNone = new Unit(undefined, 'Meter None', 'Meter None', Unit.unitRepresentType.UNUSED, 3000, 
											Unit.unitType.METER, 3, 'Meter None Suffix', Unit.displayableType.NONE, true, 'Meter None Note');
		await unitTypeUnit.insert(conn);
		await unitTypeMeterAll.insert(conn);
		await unitTypeMeterNone.insert(conn);
		const expectedUnits = [unitTypeMeterAll, unitTypeMeterNone];
		const actualUnits = await Unit.getTypeMeter(conn);
		expectArrayOfUnitsToBeEquivalen(expectedUnits, actualUnits);
	});

	mocha.it('should only get units of type unit', async () => {
		const conn = testDB.getConnection();
		const unitTypeMeter = new Unit(undefined, 'Meter', 'Meter', Unit.unitRepresentType.UNUSED, 1000, 
										Unit.unitType.METER, 1, 'Meter Suffix', Unit.displayableType.ALL, true, 'Meter Note');
		const unitTypeUnitAll = new Unit(undefined, 'Unit All', 'Unit All', Unit.unitRepresentType.UNUSED, 2000, 
											Unit.unitType.UNIT, 2, 'Unit All Suffix', Unit.displayableType.ALL, true, 'Unit All Note');
		const unitTypeUnitNone = new Unit(undefined, 'Unit None', 'Unit None', Unit.unitRepresentType.UNUSED, 3000, 
											Unit.unitType.UNIT, 3, 'Unit None Suffix', Unit.displayableType.NONE, true, 'Unit None Note');
		await unitTypeMeter.insert(conn);
		await unitTypeUnitAll.insert(conn);
		await unitTypeUnitNone.insert(conn);
		const expectedUnits = [unitTypeUnitAll, unitTypeUnitNone];
		const actualUnits = await Unit.getTypeUnit(conn);
		expectArrayOfUnitsToBeEquivalen(expectedUnits, actualUnits);
	});

	mocha.it('should only get units with suffix', async () => {
		const unitTypeUnit = new Unit(undefined, 'Unit', 'Unit', Unit.unitRepresentType.UNUSED, 1000, 
										Unit.unitType.UNIT, 1, '', Unit.displayableType.ADMIN, true, 'Unit Note');
		const unitTypeSuffixAll = new Unit(undefined, 'Suffix All', 'Suffix All', Unit.unitRepresentType.UNUSED, 2000, 
											Unit.unitType.SUFFIX, 2, 'Suffix All Suffix', Unit.displayableType.ALL, true, 'Suffix All Note');
		const unitTypeSuffixNone = new Unit(undefined, 'Suffix None', 'Suffix None', Unit.unitRepresentType.UNUSED, 3000, 
											Unit.unitType.SUFFIX, 3, 'Suffix None Suffix', Unit.displayableType.NONE, true, 'Suffix All Note');
		await unitTypeUnit.insert(conn);
		await unitTypeSuffixAll.insert(conn);
		await unitTypeSuffixNone.insert(conn);
		const expectedUnits = [unitTypeSuffixAll, unitTypeSuffixNone];
		const actualUnits = await Unit.getSuffix(conn);
		expectArrayOfUnitsToBeEquivalen(expectedUnits, actualUnits);
	});
});