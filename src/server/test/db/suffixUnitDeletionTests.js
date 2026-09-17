/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const Unit = require('../../models/Unit');
const Meter = require('../../models/Meter');
const Group = require('../../models/Group');
const Point = require('../../models/Point');
const Conversion = require('../../models/Conversion');
const gps = new Point(90, 45);
const { removeAdditionalConversionsAndUnits } = require('../../services/graph/handleSuffixUnits');

mocha.describe('Suffix unit cascade deletion', () => {

	mocha.it('deletes the auto-created suffix unit and its conversion', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent', 'Parent', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const child = new Unit(undefined, 'Child of test-suffix', 'Child', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await child.insert(conn);

		const conversion = new Conversion(parent.id, child.id, false, 1, 0, 'test conversion');
		await conversion.insert(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		const childRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [child.id]);
		expect(childRow).to.equal(null);

		const conversionAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		expect(conversionAfter).to.equal(null);
	});

	mocha.it('clears a meter\'s unit_id instead of blocking deletion', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent2', 'Parent2', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix-2', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const child = new Unit(undefined, 'Child of test-suffix-2', 'Child2', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await child.insert(conn);

		const conversion = new Conversion(parent.id, child.id, false, 1, 0, 'test conversion');
		await conversion.insert(conn);

		const meter = new Meter(undefined, 'Test Meter', null, false, true, Meter.type.OTHER, null, gps,
			'Identified Test Meter', 'notes', 35.0, true, true, '01:01:25', '00:00:00', 5, 1, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', child.id, -99,
			Unit.areaUnitType.METERS, undefined);
		await meter.insert(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		const childRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [child.id]);
		expect(childRow).to.equal(null);

		const meterAfter = await Meter.getByID(meter.id, conn);
		// unitID defaultGraphicUnit returns -99 when registered as NULL
		// Expect the unitID to be -99 instead of null for meters and groups
		expect(meterAfter.unitId).to.equal(-99);
	});

	mocha.it('cleans up other conversions referencing the auto-created unit', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent3', 'Parent3', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix-3', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const child = new Unit(undefined, 'Child of test-suffix-3', 'Child3', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await child.insert(conn);

		const otherUnit = new Unit(undefined, 'Unrelated Unit', 'Unrelated', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, '');
		await otherUnit.insert(conn);

		const conversion = new Conversion(parent.id, child.id, false, 1, 0, 'test conversion');
		await conversion.insert(conn);

		// A second, unrelated conversion also pointing at the same child unit
		const secondConversion = new Conversion(otherUnit.id, child.id, false, 2, 0, 'second conversion');
		await secondConversion.insert(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		const childRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [child.id]);
		expect(childRow).to.equal(null);

		const firstConversionAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		expect(firstConversionAfter).to.equal(null);
		
		// Check that second conversion was also deleted
		const secondConversionAfter = await Conversion.getBySourceDestination(otherUnit.id, child.id, conn);
		expect(secondConversionAfter).to.equal(null);
	});

	mocha.it('clears a group\'s default_graphic_unit instead of blocking deletion', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent4', 'Parent4', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix-4', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const child = new Unit(undefined, 'Child of test-suffix-4', 'Child4', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await child.insert(conn);

		const conversion = new Conversion(parent.id, child.id, false, 1, 0, 'test conversion');
		await conversion.insert(conn);

		const group = new Group(undefined, 'Test Group', true, gps, 'notes', 33.5, child.id);
		await group.insert(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		const childRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [child.id]);
		expect(childRow).to.equal(null);

		// unitID defaultGraphicUnit returns -99 when registered as NULL
		// Expect the unitID to be -99 instead of null for meters and groups
		const groupAfter = await Group.getByID(group.id, conn);
		expect(groupAfter.defaultGraphicUnit).to.equal(-99);
	});

	mocha.it('recursively cleans up nested suffix chains (A -> B -> C)', async () => {
		const conn = testDB.getConnection();

		const unitA = new Unit(undefined, 'A', 'A', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'chain-suffix', Unit.displayableType.ALL, true, '');
		await unitA.insert(conn);

		const unitB = new Unit(undefined, 'B (created by OED)', 'B', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await unitB.insert(conn);

		const unitC = new Unit(undefined, 'C (created by OED)', 'C', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await unitC.insert(conn);

		const convAB = new Conversion(unitA.id, unitB.id, false, 1, 0, 'A to B');
		await convAB.insert(conn);
		const convBC = new Conversion(unitB.id, unitC.id, false, 1, 0, 'B to C');
		await convBC.insert(conn);

		await removeAdditionalConversionsAndUnits(unitA, conn);

		const bRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [unitB.id]);
		const cRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [unitC.id]);
		expect(bRow).to.equal(null);
		expect(cRow).to.equal(null);
	});

	mocha.it('does not delete the parent when cleaning up from a child unit', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent5', 'Parent5', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix-5', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const child = new Unit(undefined, 'Child of test-suffix-5', 'Child5', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await child.insert(conn);

		const parentToChild = new Conversion(parent.id, child.id, false, 1, 0, 'parent to child');
		await parentToChild.insert(conn);

		// Call cleanup starting FROM the child, not the parent -- this is the
		// scenario that previously walked backward and deleted the parent.
		await removeAdditionalConversionsAndUnits(child, conn);

		const parentRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [parent.id]);
		expect(parentRow).to.not.equal(null);

		const conversionAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		expect(conversionAfter).to.not.equal(null);
	});

	mocha.it('deletes the reverse conversion when bidirectional', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent6', 'Parent6', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix-6', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const child = new Unit(undefined, 'Child of test-suffix-6', 'Child6', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await child.insert(conn);

		const forward = new Conversion(parent.id, child.id, true, 1, 0, 'forward');
		await forward.insert(conn);
		const reverse = new Conversion(child.id, parent.id, true, 1, 0, 'reverse');
		await reverse.insert(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		const forwardAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		const reverseAfter = await Conversion.getBySourceDestination(child.id, parent.id, conn);
		expect(forwardAfter).to.equal(null);
		expect(reverseAfter).to.equal(null);
	});

	mocha.it('clears stale cik rows before deleting the unit', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent7', 'Parent7', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix-7', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const child = new Unit(undefined, 'Child of test-suffix-7', 'Child7', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, '', Unit.displayableType.ALL, true, 'suffix unit created by OED');
		await child.insert(conn);

		const conversion = new Conversion(parent.id, child.id, false, 1, 0, 'test conversion');
		await conversion.insert(conn);

		// Simulate a stale cik row referencing the child unit, as would exist
		// before Cik regeneration
		await conn.none(
			'INSERT INTO cik (source_id, destination_id, slope, intercept) VALUES ($1, $2, 1, 0)',
			[child.id, parent.id]
		);

		// Should not throw.
		await removeAdditionalConversionsAndUnits(parent, conn);

		const childRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [child.id]);
		expect(childRow).to.equal(null);
	});

	mocha.it('does not touch a regular (non-suffix) unit in the same conversion set', async () => {
		const conn = testDB.getConnection();

		const parent = new Unit(undefined, 'Parent8', 'Parent8', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.SUFFIX, 'test-suffix-8', Unit.displayableType.ALL, true, '');
		await parent.insert(conn);

		const regularUnit = new Unit(undefined, 'Regular Unit', 'Regular', Unit.unitRepresentType.QUANTITY,
			1000, Unit.unitType.UNIT, '', Unit.displayableType.ALL, true, '');
		await regularUnit.insert(conn);

		const conversion = new Conversion(parent.id, regularUnit.id, false, 1, 0, 'to regular unit');
		await conversion.insert(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		// The regular unit and its conversion should be untouched -- this
		// function only cleans up OED-created (typeOfUnit === SUFFIX) units.
		const regularRow = await conn.oneOrNone('SELECT * FROM units WHERE id = $1', [regularUnit.id]);
		expect(regularRow).to.not.equal(null);

		const conversionAfter = await Conversion.getBySourceDestination(parent.id, regularUnit.id, conn);
		expect(conversionAfter).to.not.equal(null);
	});

});

