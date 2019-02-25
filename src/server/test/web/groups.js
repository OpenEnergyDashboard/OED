/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the groups API. */

const { chai, mocha, expect, app } = require('./common');
const Group = require('../../models/Group');
const Meter = require('../../models/Meter')

mocha.describe('groups API', () => {
	mocha.describe('retrieval', () => {
		let groupA, groupB, groupC, meterA, meterB, meterC;
		mocha.beforeEach(async () => {
			/*
			 * Groups and meters are created in the following hierarchy.
			 * group A
			 * - meter A
			 * - group B
			 * - - meter B
			 * - - group C
			 * - - - meter C
			 */
			groupA = new Group(undefined, 'A');
			groupB = new Group(undefined, 'B');
			groupC = new Group(undefined, 'C');
			await Promise.all([groupA, groupB, groupC].map(group => group.insert()));
			meterA = new Meter(undefined, 'A', null, false, Meter.type.MAMAC);
			meterB = new Meter(undefined, 'B', null, false, Meter.type.MAMAC);
			meterC = new Meter(undefined, 'C', null, false, Meter.type.METASYS);
			await Promise.all([meterA, meterB, meterC].map(meter => meter.insert()));

			await Promise.all([groupA.adoptMeter(meterA.id), groupA.adoptGroup(groupB.id),
				groupB.adoptGroup(groupC.id), groupB.adoptMeter(meterB.id),
				groupC.adoptMeter(meterC.id)]);
		});
		mocha.it('returns the list of existing groups', async () => {
			const res = await chai.request(app).get('/api/groups');
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.be.a('array').with.a.lengthOf(3);
			expect(res.body).to.deep.include.members([groupA, groupB, groupC]);
		});
		mocha.it('returns the immediate children of a group', async () => {
			const res = await chai.request(app).get(`/api/groups/children/${groupA.id}`)
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.property('meters');
			expect(res.body).to.have.property('groups');
			expect(res.body.meters).to.have.a.lengthOf(1).and.include(meterA.id);
			expect(res.body.groups).to.have.a.lengthOf(1).and.include(groupB.id);
		});
		mocha.it('returns the deep child meters of a group', async () => {
			const res = await chai.request(app).get(`/api/groups/deep/meters/${groupA.id}`);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.a.property('deepMeters');
			expect(res.body.deepMeters).to.include.members([meterA.id, meterB.id, meterC.id]);
		});
		mocha.it('returns the deep child groups of a group', async () => {
			const res = await chai.request(app).get(`/api/groups/deep/groups/${groupA.id}`);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.a.property('deepGroups');
			expect(res.body.deepGroups).to.include.members([groupB.id, groupC.id]);
		});
	});
});
