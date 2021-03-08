/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const Group = require('../../models/Group');

/*
 * Tests to ensure group cycles are forbidden.
 */
mocha.describe('Group Cycles', async () => {
	let group1;
	let group2;
	let group3;
	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
		await new Group(undefined, 'group1').insert(conn);
		await new Group(undefined, 'group2').insert(conn);
		await new Group(undefined, 'group3').insert(conn);
		group1 = await Group.getByName('group1', conn);
		group2 = await Group.getByName('group2', conn);
		group3 = await Group.getByName('group3', conn);
	});

	/*
	 * Tests that the child group of a group cannot also be set as its parent.
	 */
	mocha.it('Cannot save immediate cycles', async () => {
		conn = testDB.getConnection();
		await group1.adoptGroup(group2.id, conn);
		await expect(group2.adoptGroup(group1.id, conn), 'cyclic group insert was not rejected').to.eventually.be.rejected;
	});

	/*
	 * Tests that the grandchild group of a group cannot also be set as its parent.
	 */
	mocha.it('Cannot save deeply nested cycles', async () => {
		conn = testDB.getConnection();
		await group1.adoptGroup(group2.id, conn);
		await group2.adoptGroup(group3.id, conn);
		await expect(group3.adoptGroup(group1.id, conn), 'cyclic group insert was not rejected').to.eventually.be.rejected;
	});

	/*
	 * Tests that the child group of a parent group cannot be updated so that the child group is also the
	 * parent of the parent group.
	 */
	mocha.it('Cannot run update queries that create cycles', async () => {
		conn = testDB.getConnection();
		await group1.adoptGroup(group2.id, conn);
		await group2.adoptGroup(group3.id, conn);
		await expect(conn.none(`UPDATE groups_immediate_children set child_id = ${group1.id} WHERE parent_id = ${group2.id}`)).to.eventually.be.rejected;
	});
});
