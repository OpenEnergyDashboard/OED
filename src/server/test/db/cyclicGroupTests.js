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
const mocha = require('mocha');


mocha.describe('Group Cycles', async () => {
	mocha.beforeEach(recreateDB);
	let group1;
	let group2;
	mocha.beforeEach(async () => {
		await new Group(undefined, 'group1').insert();
		await new Group(undefined, 'group2').insert();
		group1 = await Group.getByName('group1');
		group2 = await Group.getByName('group2');
	});

	mocha.it('Cannot be saved', async () => {
		await group1.adoptGroup(group2.id);
		await expect(group2.adoptGroup(group1.id), 'cyclic group insert was not rejected').to.eventually.be.rejected;
	});
});
