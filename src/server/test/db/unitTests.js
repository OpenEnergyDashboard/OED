/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const Unit = require('../../models/Unit');
const { expectUnitToBeEquivalent, expectArrayOfUnitsToBeEquivalent } = require('../../util/compareUnits');

mocha.describe('Units', () => {
	mocha.it('can be saved and retrieved', async () => {
		const conn = testDB.getConnection();
		const unitTypePreInsert = new Unit(undefined, 'Unit', 'Index', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.UNIT, 5, 'Suffix', Unit.displayableType.ALL, true, 'Note');
		await unitTypePreInsert.insert(conn);
		// Gets unit by id.
		const unitTypePostInsertById = await Unit.getById(unitTypePreInsert.id, conn);
		expectUnitToBeEquivalent(unitTypePreInsert, unitTypePostInsertById);
		// Gets unit by name.
		const unitTypePostInsertByName = await Unit.getByName('Unit', conn);
		expectUnitToBeEquivalent(unitTypePreInsert, unitTypePostInsertByName);
		// Gets unit by index.
		const idUnitTypePostInsertByIdentifier = await Unit.getByUnitIndexUnit(unitTypePreInsert.unitIndex, conn);
		expect(idUnitTypePostInsertByIdentifier).to.be.equal(unitTypePostInsertById.id);
	});

	mocha.it('meter type can be retrieved by unitIndex', async () => {
		const conn = testDB.getConnection();
		const meterTypePreInsert = new Unit(undefined, 'Meter', 'Meter Id', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.METER, 5, 'Suffix', Unit.displayableType.ALL, true, 'Note');
		await meterTypePreInsert.insert(conn);
		const meterTypePostInsertId = (await Unit.getByName('Meter', conn)).id;
		const idMeterTypePostInsertByIdentifier = await Unit.getByUnitIndexMeter(meterTypePreInsert.unitIndex, conn);
		expect(idMeterTypePostInsertByIdentifier).to.be.equal(meterTypePostInsertId);
	});

	mocha.it('can be saved, edited, and retrieved', async () => {
		const conn = testDB.getConnection();
		const unitPreInsert = new Unit(undefined, 'Unit', 'Unit Id', Unit.unitRepresentType.QUANTITY,
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

	mocha.describe('With units set up', async () => {
		mocha.beforeEach(async () => {
			const conn = testDB.getConnection();
			const unitTypeMeterAll = new Unit(undefined, 'Meter All', 'Meter All Id', Unit.unitRepresentType.QUANTITY, 2000,
				Unit.unitType.METER, 1, '', Unit.displayableType.ALL, true, 'Meter All Note');
			const unitTypeMeterAdmin = new Unit(undefined, 'Meter Admin', 'Meter Admin Id', Unit.unitRepresentType.QUANTITY, 3000,
				Unit.unitType.METER, 2, 'Meter Admin Suffix', Unit.displayableType.ADMIN, true, 'Meter Admin Note');
			const unitTypeUnitAll = new Unit(undefined, 'Unit All', 'Unit All Id', Unit.unitRepresentType.QUANTITY, 4000,
				Unit.unitType.UNIT, 3, '', Unit.displayableType.ALL, true, 'Unit All Note');
			const unitTypeUnitAdmin = new Unit(undefined, 'Unit Admin', 'Unit Admin Id', Unit.unitRepresentType.QUANTITY, 5000,
				Unit.unitType.UNIT, 4, 'Unit Admin Suffix', Unit.displayableType.ADMIN, true, 'Unit Admin Note');
			const unitTypeSuffixAll = new Unit(undefined, 'Suffix All', 'Suffix All Id', Unit.unitRepresentType.QUANTITY, 6000,
				Unit.unitType.SUFFIX, 5, '', Unit.displayableType.ALL, true, 'Suffix All Note');
			const unitTypeSuffixNone = new Unit(undefined, 'Suffix None', 'Suffix None Id', Unit.unitRepresentType.QUANTITY, 7000,
				Unit.unitType.SUFFIX, 6, 'Suffix None Suffix', Unit.displayableType.NONE, true, 'Suffix None Note');
			const units = [unitTypeMeterAll, unitTypeMeterAdmin, unitTypeUnitAll, unitTypeUnitAdmin, unitTypeSuffixAll, unitTypeSuffixNone];
			await Promise.all(units.map(unit => unit.insert(conn)));
		});

		mocha.it('can get visible unit of type meter', async () => {
			const conn = testDB.getConnection();
			const unitTypeMeterAll = await Unit.getByName('Meter All', conn);
			const unitTypeMeterAdmin = await Unit.getByName('Meter Admin', conn);

			// If user is admin then return units with displayableType.admin or displayableType.all
			const expectedUnitsForAdmin = [unitTypeMeterAll, unitTypeMeterAdmin];
			const actualUnitsForAdmin = await Unit.getVisibleMeter('admin', conn);
			expectArrayOfUnitsToBeEquivalent(expectedUnitsForAdmin, actualUnitsForAdmin)
			// If user is all then return units with displayableType.all
			const expectedUnitsForAll = [unitTypeMeterAll];
			const actualUnitsForAll = await Unit.getVisibleMeter('all', conn);
			expectArrayOfUnitsToBeEquivalent(expectedUnitsForAll, actualUnitsForAll);
		});

		mocha.it('can get visible unit of type unit or suffix', async () => {
			const conn = testDB.getConnection();
			const unitTypeUnitAll = await Unit.getByName('Unit All', conn);
			const unitTypeUnitAdmin = await Unit.getByName('Unit Admin', conn);
			const unitTypeSuffixAll = await Unit.getByName('Suffix All', conn);

			// If user is admin then return units with displayableType.admin or displayableType.all
			const expectedUnitForAdmin = [unitTypeUnitAdmin, unitTypeSuffixAll, unitTypeUnitAll];
			const actualUnitsForAdmin = await Unit.getVisibleUnitOrSuffix('admin', conn);
			expectArrayOfUnitsToBeEquivalent(expectedUnitForAdmin, actualUnitsForAdmin);
			// If user is all then return units with displayableType.all
			const expectedUnitsForAll = [unitTypeSuffixAll, unitTypeUnitAll];
			const actualUnitsForAll = await Unit.getVisibleUnitOrSuffix('all', conn);
			expectArrayOfUnitsToBeEquivalent(expectedUnitsForAll, actualUnitsForAll);
		});

		mocha.it('should only get units of type meter', async () => {
			const conn = testDB.getConnection();
			const unitTypeMeterAll = await Unit.getByName('Meter All', conn);
			const unitTypeMeterAdmin = await Unit.getByName('Meter Admin', conn);
			const expectedUnits = [unitTypeMeterAll, unitTypeMeterAdmin];
			const actualUnits = await Unit.getTypeMeter(conn);
			expectArrayOfUnitsToBeEquivalent(expectedUnits, actualUnits);
		});

		mocha.it('should only get units of type unit', async () => {
			const conn = testDB.getConnection();
			const unitTypeUnitAll = await Unit.getByName('Unit All', conn);
			const unitTypeUnitAdmin = await Unit.getByName('Unit Admin', conn);
			const expectedUnits = [unitTypeUnitAll, unitTypeUnitAdmin];
			const actualUnits = await Unit.getTypeUnit(conn);
			expectArrayOfUnitsToBeEquivalent(expectedUnits, actualUnits);
		});

		mocha.it('should only get units of type suffix', async () => {
			const conn = testDB.getConnection();
			const unitTypeSuffixAll = await Unit.getByName('Suffix All', conn);
			const actualUnits = await Unit.getTypeSuffix(conn);
			expect(actualUnits.length).to.equal(1);
			expectUnitToBeEquivalent(unitTypeSuffixAll, actualUnits[0]);
		})

		mocha.it('should only get units with suffix', async () => {
			const unitTypeMeterAdmin = await Unit.getByName('Meter Admin', conn);
			const unitTypeUnitAdmin = await Unit.getByName('Unit Admin', conn);
			const unitTypeSuffixNone = await Unit.getByName('Suffix None', conn);
			const expectedUnits = [unitTypeMeterAdmin, unitTypeUnitAdmin, unitTypeSuffixNone];
			const actualUnits = await Unit.getSuffix(conn);
			expectArrayOfUnitsToBeEquivalent(expectedUnits, actualUnits);
		});
	});
});
