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
const { insertUnits, insertConversions, insertGroups } = require('../../util/insertData');

/**
 * Sets up a standard suffix unit parent/child pair for tests. Must be
 * called inside each test, since the DB resets before every test runs.
 * @param {*} conn The connection to use.
 * @returns {Promise.<{parent: Unit, child: Unit}>}
 */
async function setupParentChild(conn) {
	await insertUnits([
		{
			name: 'Parent', identifier: 'Parent', unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: 'test-suffix',
			displayable: Unit.displayableType.ALL, preferredDisplay: true, note: ''
		},
		{
			name: 'Child', identifier: 'Child', unitRepresent: Unit.unitRepresentType.QUANTITY,
			secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: '',
			displayable: Unit.displayableType.ALL, preferredDisplay: true, note: 'suffix unit created by OED'
		}
	], false, conn);
	await insertConversions([
		{ sourceName: 'Parent', destinationName: 'Child', bidirectional: false, slope: 1, intercept: 0, note: 'test conversion' }
	], conn);

	return {
		parent: await Unit.getByName('Parent', conn),
		child: await Unit.getByName('Child', conn)
	};
}

/**
 * Asserts that Unit.getById throws for the given id, i.e. the unit no
 * longer exists. Unit.getById uses conn.one internally, so it rejects
 * rather than returning null when nothing matches.
 * @param {number} id The unit id expected to no longer exist.
 * @param {*} conn The connection to use.
 */
async function expectUnitDeleted(id, conn) {
	let threw = false;
	try {
		await Unit.getById(id, conn);
	} catch (e) {
		threw = true;
	}
	expect(threw).to.equal(true);
}

mocha.describe('Suffix unit cascade deletion', () => {

	mocha.it('deletes the auto-created suffix unit and its conversion', async () => {
		const conn = testDB.getConnection();
		const { parent, child } = await setupParentChild(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		await expectUnitDeleted(child.id, conn);

		const conversionAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		expect(conversionAfter).to.equal(null);
	});

	mocha.it('clears a meter\'s unit_id instead of blocking deletion', async () => {
		const conn = testDB.getConnection();
		const { parent, child } = await setupParentChild(conn);

		// Kept as a direct constructor rather than insertMeters this test only needs
		// a meter with a given unitId, not any readings.
		const meter = new Meter(undefined, 'Test Meter', null, false, true, Meter.type.OTHER, null, gps,
			'Identified Test Meter', 'notes', 35.0, true, true, '01:01:25', '00:00:00', 5, 1, 1, 'increasing', false,
			1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', child.id, -99,
			Unit.areaUnitType.METERS, undefined);
		await meter.insert(conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		await expectUnitDeleted(child.id, conn);

		const meterAfter = await Meter.getByID(meter.id, conn);
		// unitID defaultGraphicUnit returns -99 when registered as NULL
		// Expect the unitID to be -99 instead of null for meters and groups
		expect(meterAfter.unitId).to.equal(-99);
	});

	mocha.it('cleans up other conversions referencing the auto-created unit', async () => {
		const conn = testDB.getConnection();
		const { parent, child } = await setupParentChild(conn);

		await insertUnits([
			{
				name: 'Unrelated Unit', identifier: 'Unrelated', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.UNIT, suffix: '',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: ''
			}
		], false, conn);
		await insertConversions([
			{ sourceName: 'Unrelated Unit', destinationName: 'Child', bidirectional: false, slope: 2, intercept: 0, note: 'second conversion' }
		], conn);
		const otherUnit = await Unit.getByName('Unrelated Unit', conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		await expectUnitDeleted(child.id, conn);

		const firstConversionAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		expect(firstConversionAfter).to.equal(null);

		const secondConversionAfter = await Conversion.getBySourceDestination(otherUnit.id, child.id, conn);
		expect(secondConversionAfter).to.equal(null);
	});

	mocha.it('clears a group\'s default_graphic_unit instead of blocking deletion', async () => {
		const conn = testDB.getConnection();
		const { parent, child } = await setupParentChild(conn);

		await insertGroups([
			{ name: 'Test Group', displayable: true, childMeters: [], childGroups: [], defaultGraphicUnit: 'Child' }
		], conn);
		const group = await Group.getByName('Test Group', conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		await expectUnitDeleted(child.id, conn);

		const groupAfter = await Group.getByID(group.id, conn);
		expect(groupAfter.defaultGraphicUnit).to.equal(-99);
	});

	mocha.it('recursively cleans up nested suffix chains (A -> B -> C)', async () => {
		const conn = testDB.getConnection();

		await insertUnits([
			{
				name: 'A', identifier: 'A', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: 'chain-suffix',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: ''
			},
			{
				name: 'B (created by OED)', identifier: 'B', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: '',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: 'suffix unit created by OED'
			},
			{
				name: 'C (created by OED)', identifier: 'C', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: '',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: 'suffix unit created by OED'
			}
		], false, conn);
		await insertConversions([
			{ sourceName: 'A', destinationName: 'B (created by OED)', bidirectional: false, slope: 1, intercept: 0, note: 'A to B' },
			{ sourceName: 'B (created by OED)', destinationName: 'C (created by OED)', bidirectional: false, slope: 1, intercept: 0, note: 'B to C' }
		], conn);

		const unitA = await Unit.getByName('A', conn);
		const unitB = await Unit.getByName('B (created by OED)', conn);
		const unitC = await Unit.getByName('C (created by OED)', conn);

		await removeAdditionalConversionsAndUnits(unitA, conn);

		await expectUnitDeleted(unitB.id, conn);
		await expectUnitDeleted(unitC.id, conn);
	});

	mocha.it('does not delete the parent when cleaning up from a child unit', async () => {
		const conn = testDB.getConnection();
		const { parent, child } = await setupParentChild(conn);

		// Call cleanup starting FROM the child, not the parent -- this is the
		// scenario that previously walked backward and deleted the parent.
		await removeAdditionalConversionsAndUnits(child, conn);

		const parentAfter = await Unit.getById(parent.id, conn);
		expect(parentAfter).to.not.equal(null);

		const conversionAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		expect(conversionAfter).to.not.equal(null);
	});

	mocha.it('deletes the reverse conversion when bidirectional', async () => {
		const conn = testDB.getConnection();

		await insertUnits([
			{
				name: 'Parent', identifier: 'Parent', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: 'test-suffix',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: ''
			},
			{
				name: 'Child', identifier: 'Child', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: '',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: 'suffix unit created by OED'
			}
		], false, conn);
		await insertConversions([
			{ sourceName: 'Parent', destinationName: 'Child', bidirectional: true, slope: 1, intercept: 0, note: 'forward' },
			{ sourceName: 'Child', destinationName: 'Parent', bidirectional: true, slope: 1, intercept: 0, note: 'reverse' }
		], conn);

		const parent = await Unit.getByName('Parent', conn);
		const child = await Unit.getByName('Child', conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		const forwardAfter = await Conversion.getBySourceDestination(parent.id, child.id, conn);
		const reverseAfter = await Conversion.getBySourceDestination(child.id, parent.id, conn);
		expect(forwardAfter).to.equal(null);
		expect(reverseAfter).to.equal(null);
	});

	mocha.it('clears stale cik rows before deleting the unit', async () => {
		const conn = testDB.getConnection();
		const { parent, child } = await setupParentChild(conn);

		// Simulate a stale cik row referencing the child unit, as would exist
		// before Cik regeneration
		await conn.none(
			'INSERT INTO cik (source_id, destination_id, slope, intercept) VALUES ($1, $2, 1, 0)',
			[child.id, parent.id]
		);

		// Should not throw.
		await removeAdditionalConversionsAndUnits(parent, conn);

		await expectUnitDeleted(child.id, conn);
	});

	mocha.it('does not touch a regular (non-suffix) unit in the same conversion set', async () => {
		const conn = testDB.getConnection();

		await insertUnits([
			{
				name: 'Parent', identifier: 'Parent', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.SUFFIX, suffix: 'test-suffix',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: ''
			},
			{
				name: 'Regular Unit', identifier: 'Regular', unitRepresent: Unit.unitRepresentType.QUANTITY,
				secInRate: 1000, typeOfUnit: Unit.unitType.UNIT, suffix: '',
				displayable: Unit.displayableType.ALL, preferredDisplay: true, note: ''
			}
		], false, conn);
		await insertConversions([
			{ sourceName: 'Parent', destinationName: 'Regular Unit', bidirectional: false, slope: 1, intercept: 0, note: 'to regular unit' }
		], conn);

		const parent = await Unit.getByName('Parent', conn);
		const regularUnit = await Unit.getByName('Regular Unit', conn);

		await removeAdditionalConversionsAndUnits(parent, conn);

		const regularAfter = await Unit.getById(regularUnit.id, conn);
		expect(regularAfter).to.not.equal(null);

		const conversionAfter = await Conversion.getBySourceDestination(parent.id, regularUnit.id, conn);
		expect(conversionAfter).to.not.equal(null);
	});

});