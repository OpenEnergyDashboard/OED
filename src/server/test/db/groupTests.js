/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const Group = require('../../models/Group');
const Meter = require('../../models/Meter');
const mocha = require('mocha');

async function setupGroupsAndMeters() {
	const groupA = new Group(undefined, 'A');
	const groupB = new Group(undefined, 'B');
	const groupC = new Group(undefined, 'C');
	await Promise.all([groupA, groupB, groupC].map(group => group.insert()));
	const meterA = new Meter(undefined, 'A', null, false, true, Meter.type.MAMAC);
	const meterB = new Meter(undefined, 'B', null, false, true, Meter.type.MAMAC);
	const meterC = new Meter(undefined, 'C', null, false, true, Meter.type.METASYS);
	await Promise.all([meterA, meterB, meterC].map(meter => meter.insert()));
}

mocha.describe('Groups', () => {
	mocha.beforeEach(recreateDB);
	mocha.it('can be saved and retrieved', async () => {
		const groupPreInsert = new Group(undefined, 'Group');
		await groupPreInsert.insert();
		const groupPostInsert = await Group.getByName(groupPreInsert.name);
		expect(groupPostInsert).to.have.property('name', groupPreInsert.name);
		expect(groupPostInsert).to.have.property('id', groupPreInsert.id);
	});
	mocha.it('can be renamed', async () => {
		let larry = new Group(undefined, 'Larry');
		await larry.insert();
		// pull larry back out of the db so that we get his ID
		larry = await Group.getByName('Larry');
		// rename 'Larry' -> 'Bob'
		await larry.rename('Bob');
		// bob should be larry, but renamed
		const bob = await Group.getByID(larry.id);
		expect(bob.id).to.equal(larry.id);
		expect(bob.name).to.deep.equal('Bob');

		expect(bob).to.have.property('name', 'Bob');
	});
	mocha.describe('With groups and meters set up', () => {
		mocha.beforeEach(setupGroupsAndMeters);
		mocha.it('can be given a child group', async () => {
			const parent = await Group.getByName('A');
			const child = await Group.getByName('B');
			await parent.adoptGroup(child.id);
			const childrenOfParent = await (Group.getImmediateGroupsByGroupID(parent.id));
			expect(childrenOfParent).to.deep.equal([child.id]);
			const parentsOfChild = await child.getParents();
			expect(parentsOfChild).to.deep.equal([parent.id]);
		});

		mocha.it('can be given a child meter', async () => {
			const parent = await Group.getByName('A');
			const meter = await Meter.getByName('A');
			await parent.adoptMeter(meter.id);
			const metersOfParent = await (Group.getImmediateMetersByGroupID(parent.id));
			expect(metersOfParent).to.deep.equal([meter.id]);
			const deepMetersOfParent = await Group.getDeepMetersByGroupID(parent.id);
			expect(deepMetersOfParent).to.deep.equal([meter.id]);
		});

		mocha.it('can be given a deep child group', async () => {
			const parent = await Group.getByName('A');
			const child = await Group.getByName('B');
			const grandchild = await Group.getByName('C');
			await parent.adoptGroup(child.id);
			await child.adoptGroup(grandchild.id);
			const deepChildrenOfParent = await Group.getDeepGroupsByGroupID(parent.id);
			expect(deepChildrenOfParent.sort()).to.deep.equal([child.id, grandchild.id].sort());
		});

		mocha.it('can be given both deep children and deep meters', async () => {
			const parent = await Group.getByName('A');
			const child = await Group.getByName('B');
			const grandchild = await Group.getByName('C');
			const immediateMeter = await Meter.getByName('A');
			const childsMeter = await Meter.getByName('B');
			const grandchildsMeter = await Meter.getByName('C');
			await parent.adoptMeter(immediateMeter.id);
			await parent.adoptGroup(child.id);
			await child.adoptMeter(childsMeter.id);
			await child.adoptGroup(grandchild.id);
			await grandchild.adoptMeter(grandchildsMeter.id);

			const deepMetersOfParent = await Group.getDeepMetersByGroupID(parent.id);
			const deepGroupsOfParent = await Group.getDeepGroupsByGroupID(parent.id);
			const expectedMeters = [immediateMeter.id, childsMeter.id, grandchildsMeter.id].sort();
			const expectedGroups = [child.id, grandchild.id].sort();

			expect(deepMetersOfParent.sort()).to.deep.equal(expectedMeters);
			expect(deepGroupsOfParent.sort()).to.deep.equal(expectedGroups);
		});

		mocha.it('can disown child groups', async () => {
			const parent = await Group.getByName('A');
			const lovedChild = await Group.getByName('B');
			const impendingOrphan = await Group.getByName('C');

			await parent.adoptGroup(lovedChild.id);
			await parent.adoptGroup(impendingOrphan.id);

			let children = await Group.getImmediateGroupsByGroupID(parent.id);
			expect(children.sort()).to.deep.equal([lovedChild.id, impendingOrphan.id].sort());

			await parent.disownGroup(impendingOrphan.id);
			children = await Group.getImmediateGroupsByGroupID(parent.id);
			expect(children).to.deep.equal([lovedChild.id]);
		});

		mocha.it('can disown child meters', async () => {
			const parent = await Group.getByName('A');
			const lovedMeter = await Meter.getByName('A');
			const impendingOrphan = await Meter.getByName('B');

			await parent.adoptMeter(lovedMeter.id);
			await parent.adoptMeter(impendingOrphan.id);

			let meters = await Group.getImmediateMetersByGroupID(parent.id);
			expect(meters.sort()).to.deep.equal([lovedMeter.id, impendingOrphan.id].sort());

			await parent.disownMeter(impendingOrphan.id);
			meters = await Group.getImmediateMetersByGroupID(parent.id);
			expect(meters).to.deep.equal([lovedMeter.id]);
		});

		mocha.it('can be deleted', async () => {
			const unwanted = await Group.getByName('A');
			const parent = await Group.getByName('B');
			const child = await Group.getByName('C');
			const meter = await Meter.getByName('A');

			// both unwanted and child are children of parent
			await parent.adoptGroup(unwanted.id);
			await parent.adoptGroup(child.id);

			// child is a child of unwanted
			await unwanted.adoptGroup(child.id);

			// meter is a child meter of unwanted
			await unwanted.adoptMeter(meter.id);

			// that we have all three groups
			let allGroups = await Group.getAll();
			allGroups = allGroups.map(g => g.id);
			expect(allGroups.sort()).to.deep.equal([unwanted.id, parent.id, child.id].sort());

			// Verify that both unwanted and child are children of parent
			let childrenOfParent = await Group.getImmediateGroupsByGroupID(parent.id);
			expect(childrenOfParent.sort()).to.deep.equal([unwanted.id, child.id].sort());

			// Verify that both unwanted and parent are parents of child
			let parentsOfChild = await child.getParents();
			expect(parentsOfChild.sort()).to.deep.equal([unwanted.id, parent.id].sort());

			// Verify that meter is the sole child meter of unwanted
			let metersOfUnwanted = await Group.getImmediateMetersByGroupID(unwanted.id);
			expect(metersOfUnwanted).to.deep.equal([meter.id]);

			// Delete unwanted group
			await Group.delete(unwanted.id);

			// Verify that child is the sole child of parent
			childrenOfParent = await Group.getImmediateGroupsByGroupID(parent.id);
			expect(childrenOfParent).to.deep.equal([child.id]);

			// Verify that parent is the sole parent of child
			parentsOfChild = await child.getParents();
			expect(parentsOfChild).to.deep.equal([parent.id]);

			// Verify unwanted has no child meters
			metersOfUnwanted = await Group.getImmediateMetersByGroupID(unwanted.id);
			expect(metersOfUnwanted).to.deep.equal([]);

			// Verify that unwanted has been deleted from the groups table
			allGroups = await Group.getAll();
			allGroups = allGroups.map(g => g.id);
			expect(allGroups.sort()).to.deep.equal([parent.id, child.id].sort());
		});
	});
});
