/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const Group = require('../../models/Group');
const Meter = require('../../models/Meter');
const Point = require('../../models/Point');
const Unit = require('../../models/Unit');
const gps = new Point(90, 45);

async function setupGroupsAndMeters(conn) {
	const unitA = new Unit(undefined, 'Unit A', 'Unit A Id', Unit.unitRepresentType.UNUSED, 1000, 
							Unit.unitType.UNIT, 1, 'Unit A Suffix', Unit.displayableType.ALL, true, 'Unit A Note');
	const unitB = new Unit(undefined, 'Unit B', 'Unit B Id', Unit.unitRepresentType.UNUSED, 2000, 
							Unit.unitType.UNIT, 2, 'Unit B Suffix', Unit.displayableType.ALL, true, 'Unit B Note');
	const unitC = new Unit(undefined, 'Unit C', 'Unit C Id', Unit.unitRepresentType.UNUSED, 3000, 
							Unit.unitType.UNIT, 3, 'Unit C Suffix', Unit.displayableType.ALL, true, 'Unit C Note');
	await Promise.all([unitA, unitB, unitC].map(unit => unit.insert(conn)));
	const unitAId = (await Unit.getByName('Unit A', conn)).id;
	const unitBId = (await Unit.getByName('Unit B', conn)).id;
	const unitCId = (await Unit.getByName('Unit C', conn)).id;
	const groupA = new Group(undefined, 'GA', true, gps, 'notes GA', 33.5, unitAId);
	const groupB = new Group(undefined, 'GB', false, gps, 'notes GB', 43.5, unitBId);
	const groupC = new Group(undefined, 'GC', true, gps, 'notes GC', 53.5, -99);
	await Promise.all([groupA, groupB, groupC].map(group => group.insert(conn)));
	const meterA = new Meter(undefined, 'MA', null, false, true, Meter.type.MAMAC, null, gps,
	'Identified MA' ,'notes MA', 35.0, true, true, '01:01:25', '00:00:00', 5, 1, 1, 'increasing', false,
	1.5, '0001-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitAId, unitBId,
	Unit.areaUnitType.METERS, undefined);
	const meterB = new Meter(undefined, 'MB', null, false, true, Meter.type.OTHER, null, gps,
	'Identified MB', 'notes MB', 33.5, true, true, '05:05:09', '09:00:01', 0, 0, 1, 'increasing', false,
	25.5, '0002-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitBId, unitCId,
	Unit.areaUnitType.METERS, undefined);
	const meterC = new Meter(undefined, 'MC', null, false, true, Meter.type.METASYS, null, gps,
	'Identified MC', 'notes MC', 33.5, true, true, '05:05:09', '09:00:01', 0, 0, 1, 'increasing', false,
	25.5, '0003-01-01 23:59:59', '2020-07-02 01:00:10', '2020-03-05 02:12:00', unitCId, unitAId,
	Unit.areaUnitType.METERS, undefined);
	await Promise.all([meterA, meterB, meterC].map(meter => meter.insert(conn)));
}

/**
 * Compares the expected and the actual groups.
 * @param {*} expected The expected group.
 * @param {*} actual The actual group.
 */
function expectGroupToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('id', expected.id);
	expect(actual).to.have.property('name', expected.name);
	expect(actual).to.have.property('displayable', expected.displayable);
	expect(actual).to.have.property('gps');
	expect(actual.gps).to.have.property('latitude', expected.gps.latitude);
	expect(actual.gps).to.have.property('longitude', expected.gps.longitude);
	expect(actual).to.have.property('note', expected.note);
	expect(actual).to.have.property('area', expected.area);
	expect(actual).to.have.property('defaultGraphicUnit', expected.defaultGraphicUnit);
}

mocha.describe('Groups', () => {
	mocha.it('can be saved and retrieved', async () => {
		conn = testDB.getConnection();
		const groupPreInsert = new Group(undefined, 'Group', true, gps, 'notes', 33.5, -99);
		await groupPreInsert.insert(conn);
		const groupPostInsert = await Group.getByName(groupPreInsert.name, conn);
		expectGroupToBeEquivalent(groupPreInsert, groupPostInsert);
	});

	mocha.it('can be saved, updated, and retrieved', async () => {
		conn = testDB.getConnection();
		const groupPreInsert = new Group(undefined, 'Group', true, gps, 'notes', 33.5, -99);
		await groupPreInsert.insert(conn);

		groupPreInsert.name = 'New name';
		const unit = new Unit(undefined, 'Unit', 'Unit Id', Unit.unitRepresentType.UNUSED, 1000, 
								Unit.unitType.UNIT, 1, 'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note');
		await unit.insert(conn);
		const unitId = (await Unit.getByName('Unit', conn)).id;
		groupPreInsert.defaultGraphicUnit = unitId;

		await groupPreInsert.update(conn);
		const groupPostInsert = await Group.getByName('New name', conn);
		expectGroupToBeEquivalent(groupPreInsert, groupPostInsert);
	});

	mocha.it('can be renamed', async () => {
		conn = testDB.getConnection();
		let larry = new Group(undefined, 'Larry');
		await larry.insert(conn);
		// pull larry back out of the db so that we get his ID
		larry = await Group.getByName('Larry', conn);
		// rename 'Larry' -> 'Bob'
		larry.name = 'Bob';
		await larry.update(conn);
		// bob should be larry, but renamed
		const bob = await Group.getByID(larry.id, conn);
		expect(bob.id).to.equal(larry.id);
		expect(bob.name).to.deep.equal('Bob');
		expect(bob).to.have.property('name', 'Bob');
	});

	mocha.describe('With groups and meters set up', () => {
		mocha.beforeEach(() => setupGroupsAndMeters(testDB.getConnection()));
		mocha.it('can be given a child group', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('GA', conn);
			const child = await Group.getByName('GB', conn);
			await parent.adoptGroup(child.id, conn);
			const childrenOfParent = await (Group.getImmediateGroupsByGroupID(parent.id, conn));
			expect(childrenOfParent).to.deep.equal([child.id]);
			const parentsOfChild = await child.getParents(conn);
			expect(parentsOfChild).to.deep.equal([parent.id]);
		});

		mocha.it('can be given a child meter', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('GA', conn);
			const meter = await Meter.getByName('MA', conn);
			await parent.adoptMeter(meter.id, conn);
			const metersOfParent = await (Group.getImmediateMetersByGroupID(parent.id, conn));
			expect(metersOfParent).to.deep.equal([meter.id]);
			const deepMetersOfParent = await Group.getDeepMetersByGroupID(parent.id, conn);
			expect(deepMetersOfParent).to.deep.equal([meter.id]);
		});

		mocha.it('can be given a deep child group', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('GA', conn);
			const child = await Group.getByName('GB', conn);
			const grandchild = await Group.getByName('GC', conn);
			await parent.adoptGroup(child.id, conn);
			await child.adoptGroup(grandchild.id, conn);
			const deepChildrenOfParent = await Group.getDeepGroupsByGroupID(parent.id, conn);
			expect(deepChildrenOfParent.sort()).to.deep.equal([child.id, grandchild.id].sort());
		});

		mocha.it('can be given both deep children and deep meters', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('GA', conn);
			const child = await Group.getByName('GB', conn);
			const grandchild = await Group.getByName('GC', conn);
			const immediateMeter = await Meter.getByName('MA', conn);
			const childsMeter = await Meter.getByName('MB', conn);
			const grandchildsMeter = await Meter.getByName('MC', conn);
			await parent.adoptMeter(immediateMeter.id, conn);
			await parent.adoptGroup(child.id, conn);
			await child.adoptMeter(childsMeter.id, conn);
			await child.adoptGroup(grandchild.id, conn);
			await grandchild.adoptMeter(grandchildsMeter.id, conn);

			const deepMetersOfParent = await Group.getDeepMetersByGroupID(parent.id, conn);
			const deepGroupsOfParent = await Group.getDeepGroupsByGroupID(parent.id, conn);
			const expectedMeters = [immediateMeter.id, childsMeter.id, grandchildsMeter.id].sort();
			const expectedGroups = [child.id, grandchild.id].sort();

			expect(deepMetersOfParent.sort()).to.deep.equal(expectedMeters);
			expect(deepGroupsOfParent.sort()).to.deep.equal(expectedGroups);
		});

		mocha.it('can disown child groups', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('GA', conn);
			const lovedChild = await Group.getByName('GB', conn);
			const impendingOrphan = await Group.getByName('GC', conn);

			await parent.adoptGroup(lovedChild.id, conn);
			await parent.adoptGroup(impendingOrphan.id, conn);

			let children = await Group.getImmediateGroupsByGroupID(parent.id, conn);
			expect(children.sort()).to.deep.equal([lovedChild.id, impendingOrphan.id].sort());

			await parent.disownGroup(impendingOrphan.id, conn);
			children = await Group.getImmediateGroupsByGroupID(parent.id, conn);
			expect(children).to.deep.equal([lovedChild.id]);
		});

		mocha.it('can disown child meters', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('GA', conn);
			const lovedMeter = await Meter.getByName('MA', conn);
			const impendingOrphan = await Meter.getByName('MB', conn);

			await parent.adoptMeter(lovedMeter.id, conn);
			await parent.adoptMeter(impendingOrphan.id, conn);

			let meters = await Group.getImmediateMetersByGroupID(parent.id, conn);
			expect(meters.sort()).to.deep.equal([lovedMeter.id, impendingOrphan.id].sort());

			await parent.disownMeter(impendingOrphan.id, conn);
			meters = await Group.getImmediateMetersByGroupID(parent.id, conn);
			expect(meters).to.deep.equal([lovedMeter.id]);
		});

		mocha.it('can be deleted', async () => {
			conn = testDB.getConnection();
			const unwanted = await Group.getByName('GA', conn);
			const parent = await Group.getByName('GB', conn);
			const child = await Group.getByName('GC', conn);
			const meter = await Meter.getByName('MA', conn);

			// both unwanted and child are children of parent
			await parent.adoptGroup(unwanted.id, conn);
			await parent.adoptGroup(child.id, conn);

			// child is a child of unwanted
			await unwanted.adoptGroup(child.id, conn);

			// meter is a child meter of unwanted
			await unwanted.adoptMeter(meter.id, conn);

			// that we have all three groups
			let allGroups = await Group.getAll(conn);
			allGroups = allGroups.map(g => g.id);
			expect(allGroups.sort()).to.deep.equal([unwanted.id, parent.id, child.id].sort());

			// Verify that both unwanted and child are children of parent
			let childrenOfParent = await Group.getImmediateGroupsByGroupID(parent.id, conn);
			expect(childrenOfParent.sort()).to.deep.equal([unwanted.id, child.id].sort());

			// Verify that both unwanted and parent are parents of child
			let parentsOfChild = await child.getParents(conn);
			expect(parentsOfChild.sort()).to.deep.equal([unwanted.id, parent.id].sort());

			// Verify that meter is the sole child meter of unwanted
			let metersOfUnwanted = await Group.getImmediateMetersByGroupID(unwanted.id, conn);
			expect(metersOfUnwanted).to.deep.equal([meter.id]);

			// Delete unwanted group
			await Group.delete(unwanted.id, conn);

			// Verify that child is the sole child of parent
			childrenOfParent = await Group.getImmediateGroupsByGroupID(parent.id, conn);
			expect(childrenOfParent).to.deep.equal([child.id]);

			// Verify that parent is the sole parent of child
			parentsOfChild = await child.getParents(conn);
			expect(parentsOfChild).to.deep.equal([parent.id]);

			// Verify unwanted has no child meters
			metersOfUnwanted = await Group.getImmediateMetersByGroupID(unwanted.id, conn);
			expect(metersOfUnwanted).to.deep.equal([]);

			// Verify that unwanted has been deleted from the groups table
			allGroups = await Group.getAll(conn);
			allGroups = allGroups.map(g => g.id);
			expect(allGroups.sort()).to.deep.equal([parent.id, child.id].sort());
		});

		mocha.it('can get all displayable groups', async () => {
			conn = testDB.getConnection();
			const groupA = await Group.getByName('GA', conn);
			const groupC = await Group.getByName('GC', conn);
			const actualGroups = await Group.getDisplayable(conn);
			const expectedGroups = [groupA, groupC];
			
			expect(expectedGroups.length).to.be.equal(actualGroups.length);
			// Sorts the list so that groups are in the correct order.
			actualGroups.sort((a, b) => a.id - b.id);
			expectedGroups.sort((a, b) => a.id - b.id);

			for (let i = 0; i < actualGroups.length; ++i) {
				expectGroupToBeEquivalent(expectedGroups[i], actualGroups[i]);
			}
		});
	});
});
