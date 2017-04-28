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
const db = require('../../models/database').db;
const Group = require('../../models/Group');
const Meter = require('../../models/Meter');
const mocha = require('mocha');

async function setupGroupsAndMeters() {
	const groupA = new Group(undefined, 'A');
	const groupB = new Group(undefined, 'B');
	const groupC = new Group(undefined, 'C');
	await Promise.all([groupA, groupB, groupC].map(group => group.insert()));
	const meterA = new Meter(undefined, 'A', null, false, Meter.type.MAMAC);
	const meterB = new Meter(undefined, 'B', null, false, Meter.type.MAMAC);
	const meterC = new Meter(undefined, 'C', null, false, Meter.type.METASYS);
	await Promise.all([meterA, meterB, meterC].map(meter => meter.insert()));
}

mocha.describe('Groups', () => {
	mocha.beforeEach(recreateDB);
	mocha.it('can be saved and retrieved', async () => {
		const groupPreInsert = new Group(undefined, 'Group');
		await groupPreInsert.insert();
		const groupPostInsert = await Group.getByName(groupPreInsert.name);
		expect(groupPostInsert).to.have.property('name', groupPreInsert.name);
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
			await parent.associateWithChildGroup(child.id);
			const childrenOfParent = await (Group.getImmediateGroupsByGroupID(parent.id));
			expect(childrenOfParent).to.deep.equal([child.id]);
		});

		mocha.it('can be given a child meter', async () => {
			const parent = await Group.getByName('A');
			const meter = await Meter.getByName('A');
			await parent.associateWithChildMeter(meter.id);
			const metersOfParent = await (Group.getImmediateMetersByGroupID(parent.id));
			expect(metersOfParent).to.deep.equal([meter.id]);
		});

		mocha.it('can be given a deep child group', async () => {
			const parent = await Group.getByName('A');
			const child = await Group.getByName('B');
			const grandchild = await Group.getByName('C');
			await parent.associateWithChildGroup(child.id);
			await child.associateWithChildGroup(grandchild.id);
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
			await parent.associateWithChildMeter(immediateMeter.id);
			await parent.associateWithChildGroup(child.id);
			await child.associateWithChildMeter(childsMeter.id);
			await child.associateWithChildGroup(grandchild.id);
			await grandchild.associateWithChildMeter(grandchildsMeter.id);

			const deepMetersOfParent = await Group.getDeepMetersByGroupID(parent.id);
			const deepGroupsOfParent = await Group.getDeepGroupsByGroupID(parent.id);
			const expectedMeters = [immediateMeter.id, childsMeter.id, grandchildsMeter.id].sort();
			const expectedGroups = [child.id, grandchild.id].sort();

			expect(deepMetersOfParent.sort()).to.deep.equal(expectedMeters);
			expect(deepGroupsOfParent.sort()).to.deep.equal(expectedGroups);
		});
	});
});
