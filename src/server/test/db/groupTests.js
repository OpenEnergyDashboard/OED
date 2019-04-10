/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const Group = require('../../models/Group');
const Meter = require('../../models/Meter');

async function setupGroupsAndMeters(conn) {
	const groupA = new Group(undefined, 'A');
	const groupB = new Group(undefined, 'B');
	const groupC = new Group(undefined, 'C');
	await Promise.all([groupA, groupB, groupC].map(group => group.insert(conn)));
	const meterA = new Meter(undefined, 'A', null, false, true, Meter.type.MAMAC);
	const meterB = new Meter(undefined, 'B', null, false, true, Meter.type.MAMAC);
	const meterC = new Meter(undefined, 'C', null, false, true, Meter.type.METASYS);
	await Promise.all([meterA, meterB, meterC].map(meter => meter.insert(conn)));
}

mocha.describe('Groups', () => {
	mocha.it('can be saved and retrieved', async () => {
		conn = testDB.getConnection();
		const groupPreInsert = new Group(undefined, 'Group');
		await groupPreInsert.insert(conn);
		const groupPostInsert = await Group.getByName(groupPreInsert.name, conn);
		expect(groupPostInsert).to.have.property('name', groupPreInsert.name);
		expect(groupPostInsert).to.have.property('id', groupPreInsert.id);
	});
	mocha.it('can be renamed', async () => {
		conn = testDB.getConnection();
		let larry = new Group(undefined, 'Larry');
		await larry.insert(conn);
		// pull larry back out of the db so that we get his ID
		larry = await Group.getByName('Larry', conn);
		// rename 'Larry' -> 'Bob'
		await larry.rename('Bob', conn);
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
			const parent = await Group.getByName('A', conn);
			const child = await Group.getByName('B', conn);
			await parent.adoptGroup(child.id, conn);
			const childrenOfParent = await (Group.getImmediateGroupsByGroupID(parent.id, conn));
			expect(childrenOfParent).to.deep.equal([child.id]);
			const parentsOfChild = await child.getParents(conn);
			expect(parentsOfChild).to.deep.equal([parent.id]);
		});

		mocha.it('can be given a child meter', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('A', conn);
			const meter = await Meter.getByName('A', conn);
			await parent.adoptMeter(meter.id, conn);
			const metersOfParent = await (Group.getImmediateMetersByGroupID(parent.id, conn));
			expect(metersOfParent).to.deep.equal([meter.id]);
			const deepMetersOfParent = await Group.getDeepMetersByGroupID(parent.id, conn);
			expect(deepMetersOfParent).to.deep.equal([meter.id]);
		});

		mocha.it('can be given a deep child group', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('A', conn);
			const child = await Group.getByName('B', conn);
			const grandchild = await Group.getByName('C', conn);
			await parent.adoptGroup(child.id, conn);
			await child.adoptGroup(grandchild.id, conn);
			const deepChildrenOfParent = await Group.getDeepGroupsByGroupID(parent.id, conn);
			expect(deepChildrenOfParent.sort()).to.deep.equal([child.id, grandchild.id].sort());
		});

		mocha.it('can be given both deep children and deep meters', async () => {
			conn = testDB.getConnection();
			const parent = await Group.getByName('A', conn);
			const child = await Group.getByName('B', conn);
			const grandchild = await Group.getByName('C', conn);
			const immediateMeter = await Meter.getByName('A', conn);
			const childsMeter = await Meter.getByName('B', conn);
			const grandchildsMeter = await Meter.getByName('C', conn);
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
			const parent = await Group.getByName('A', conn);
			const lovedChild = await Group.getByName('B', conn);
			const impendingOrphan = await Group.getByName('C', conn);

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
			const parent = await Group.getByName('A', conn);
			const lovedMeter = await Meter.getByName('A', conn);
			const impendingOrphan = await Meter.getByName('B', conn);

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
			const unwanted = await Group.getByName('A', conn);
			const parent = await Group.getByName('B', conn);
			const child = await Group.getByName('C', conn);
			const meter = await Meter.getByName('A', conn);

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
	});
});
