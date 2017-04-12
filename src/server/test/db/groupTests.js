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
	const groupA = new Group(undefined, 'Group A');
	const groupB = new Group(undefined, 'Group B');
	const groupC = new Group(undefined, 'Group C');
	await Promise.all([groupA, groupB, groupC].map(group => group.insert()));
	const meterA = new Meter(undefined, 'Meter A', null, false, Meter.type.MAMAC);
	const meterB = new Meter(undefined, 'Meter B', null, false, Meter.type.MAMAC);
	const meterC = new Meter(undefined, 'Meter C', null, false, Meter.type.METASYS);
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
	mocha.describe('With groups and meters set up', () => {
		mocha.beforeEach(setupGroupsAndMeters);
		mocha.it('can be given a child group', async () => {
			const parent = await Group.getByName('Group A');
			const child = await Group.getByName('Group B');
			await parent.associateWithChildGroup(child.id);
			const childrenOfParent = await (Group.getImmediateGroupsByGroupID(parent.id));
			expect(childrenOfParent).to.deep.equal([child.id]);
		});

		mocha.it('can be given a child meter', async () => {
			const parent = await Group.getByName('Group A');
			const meter = await Meter.getByName('Meter A');
			await parent.associateWithChildMeter(meter.id);
			const metersOfParent = await (Group.getImmediateMetersByGroupID(parent.id));
			expect(metersOfParent).to.deep.equal([meter.id]);
		});

		mocha.it('can be given a deep child group', async () => {
			const parent = await Group.getByName('Group A');
			const child = await Group.getByName('Group B');
			const grandchild = await Group.getByName('Group C');
			await parent.associateWithChildGroup(child.id);
			await child.associateWithChildGroup(grandchild.id);
			const deepChildrenOfParent = await Group.getDeepGroupsByGroupID(parent.id);
			expect(deepChildrenOfParent.sort()).to.deep.equal([child.id, grandchild.id].sort());
		});
	});
});
