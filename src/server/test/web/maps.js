/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const Map = require('../../models/Map');
const Point = require('../../models/Point');
const moment = require('moment');

const origin = new Point(0.000001, 0.000001);
const opposite = new Point(179.999999, 89.999999);
const invalidOpposite = new Point(200, 100);

function expectPointsToBeEquivalent(expected, actual) {
	expect(actual).to.have.property('longitude', expected.longitude);
	expect(actual).to.have.property('latitude', expected.latitude);
}

function expectMapsToBeEquivalent(maps, length) {
	for (let i = 0; i++; i < length) {
		const map = maps[i];
		expect(map).to.have.property('id');
		expect(map).to.have.property('name', `Map ${i + 1}`);
		expect(map).to.have.property('displayable', true);
		expect(map).to.have.property('note', null);
		expect(map).to.have.property('filename', 'default');
		expect(map.modifiedDate.isSame(moment('2000-10-10'))).to.equal(true);
		expect(map).to.have.property('origin');
		expectPointsToBeEquivalent(map.origin, origin);
		expect(map).to.have.property('opposite');
		expectPointsToBeEquivalent(map.opposite, opposite);
		expect(map).to.have.property('mapSource', 'placeholder');
	}
}

mocha.describe('maps API', () => {
	mocha.beforeEach(async () => {
	});

	mocha.it('returns nothing when no map is present', async () => {
		const res = await chai.request(app).get('/api/maps');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(0);
	});

	mocha.it('returns all visible maps', async () => {
		const conn = testDB.getConnection();
		await new Map(undefined, 'Map 1', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);
		await new Map(undefined, 'Map 2', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);
		await new Map(undefined, 'Map 3', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);
		await new Map(undefined, 'Not Visible', false, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);

		const res = await chai.request(app).get('/api/maps');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(3);

		expectMapsToBeEquivalent(res.body, 3);
	});
	mocha.describe('with authentication', () => {
		let token;
		mocha.before(async () => {
			let res = await chai.request(app).post('/api/login')
				.send({ email: testUser.email, password: testUser.password });
			token = res.body.token;
		});
		mocha.it('returns all maps', async () => {
			const conn = testDB.getConnection();
			await new Map(undefined, 'Map 1', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);
			await new Map(undefined, 'Map 2', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);
			await new Map(undefined, 'Map 3', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);
			await new Map(undefined, 'Not Visible', false, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);

			const res = await chai.request(app).get('/api/maps').set('token', token);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.lengthOf(4);

			expectMapsToBeEquivalent(res.body, 4);
		});
	});

	mocha.it('returns details on a single map by ID', async () => {
		const conn = testDB.getConnection();
		await new Map(undefined, 'Map 1', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder").insert(conn);
		const map2 = new Map(undefined, 'Map 2', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder");
		await map2.insert(conn);

		const res = await chai.request(app).get(`/api/maps/${map2.id}`);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.property('id', map2.id);
		expect(res.body).to.have.property('name', 'Map 2');
	});

	mocha.it('responds appropriately when the meter in question does not exist', async () => {
		const conn = testDB.getConnection();
		const map = new Map(undefined, 'Map', true, null, "default", moment('2000-10-10'), origin, opposite, "placeholder");
		await map.insert(conn);

		const res = await chai.request(app).get(`/api/maps/${map.id + 1}`);
		expect(res).to.have.status(500);
	});
});
