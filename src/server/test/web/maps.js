/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const { Map } = require('../../models/Map');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
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
	for (let i = 0; i < length; i++) {
		const map = maps[i];
		expect(map).to.have.property('id');
		if (i === 3) {
			// Map not visible, only happens on admin map checks.
			expect(map).to.have.property('name', 'Not Visible');
			expect(map).to.have.property('displayable', false);
		} else {
			expect(map).to.have.property('name', `Map ${i + 1}`);
			expect(map).to.have.property('displayable', true);
		}
		expect(map).to.have.property('note', null);
		expect(map).to.have.property('filename', 'default');
		// The date set in the test code has a midnight time added and it comes back as a string.
		expect(map).to.have.property('modifiedDate', '2000-10-10T00:00:00.000Z');
		expect(map).to.have.property('origin');
		expectPointsToBeEquivalent(map.origin, origin);
		expect(map).to.have.property('opposite');
		expectPointsToBeEquivalent(map.opposite, opposite);
		expect(map).to.have.property('mapSource', 'placeholder');
		expect(map).to.have.property('northAngle', i + 1);
		expect(map).to.have.property('circleSize', (i + 1) / 10);
	}
}

mocha.describe('maps API', () => {
	mocha.beforeEach(async () => {
		// TODO Why is there an empty body here?
	});

	mocha.it('returns nothing when no map is present', async () => {
		const res = await chai.request(app).get('/api/maps');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(0);
	});

	mocha.it('returns all visible maps', async () => {
		const conn = testDB.getConnection();
		await new Map(undefined, 'Map 1', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 1.0, 0.1).insert(conn);
		await new Map(undefined, 'Map 2', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 2.0, 0.2).insert(conn);
		await new Map(undefined, 'Map 3', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 3.0, 0.3).insert(conn);
		// Not visible.
		await new Map(undefined, 'Not Visible', false, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 0.0, 0.0).insert(conn);

		const res = await chai.request(app).get('/api/maps');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(3);

		expectMapsToBeEquivalent(res.body, 3);
	});
	mocha.describe('Admin role:', () => {
		let token;
		// Since this .before is in the middle of tests, it should not have issues as
		// documented in usersTest.js.
		mocha.before(async () => {
			let res = await chai.request(app).post('/api/login')
				.send({ username: testUser.username, password: testUser.password });
			token = res.body.token;
		});
		mocha.it('returns all maps', async () => {
			const conn = testDB.getConnection();
			await new Map(undefined, 'Map 1', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 1.0, 0.1).insert(conn);
			await new Map(undefined, 'Map 2', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 2.0, 0.2).insert(conn);
			await new Map(undefined, 'Map 3', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 3.0, 0.3).insert(conn);
			// Not visible.
			await new Map(undefined, 'Not Visible', false, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 4.0, 0.4).insert(conn);

			const res = await chai.request(app).get('/api/maps').set('token', token);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.lengthOf(4);

			expectMapsToBeEquivalent(res.body, 4);
		});
	});

	mocha.describe('Non-Admin role:', () => {
		for (const role in User.role) {
			if (User.role[role] !== User.role.ADMIN) {
				let token;
				mocha.beforeEach(async () => {
					// insert test user
					const conn = testDB.getConnection();
					const password = 'password';
					const hashedPassword = await bcrypt.hash(password, 10);
					const unauthorizedUser = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
					await unauthorizedUser.insert(conn);
					unauthorizedUser.password = password;

					// login
					let res = await chai.request(app).post('/api/login')
						.send({ username: unauthorizedUser.username, password: unauthorizedUser.password });
					token = res.body.token;
				});
				mocha.it(`should reject requests from ${role} to create maps`, async () => {
					// get maps
					let res = await chai.request(app).post('/api/maps/create').set('token', token);
					expect(res).to.have.status(403);
				});

				mocha.it(`should reject requests from ${role} to edit maps`, async () => {
					let res = await chai.request(app).post('/api/maps/edit').set('token', token);
					expect(res).to.have.status(403);
				});

				mocha.it(`should reject requests from ${role} to delete maps`, async () => {
					let res = await chai.request(app).post('/api/maps/delete').set('token', token);
					expect(res).to.have.status(403);
				});
				mocha.it(`should only show visible maps to ${role}`, async () => {
					const conn = testDB.getConnection();
					// Insert maps
					await new Map(undefined, 'Map 1', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder').insert(conn);
					await new Map(undefined, 'Map 2', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder').insert(conn);
					await new Map(undefined, 'Map 3', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder').insert(conn);
					await new Map(undefined, 'Not Visible', false, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder').insert(conn);
					// Insert user
					const password = 'password';
					const hashedPassword = await bcrypt.hash(password, 10);

					// get maps
					let res = await chai.request(app).get('/api/maps').set('token', token);
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.lengthOf(3);
					const allMapsAreDisplayable = res.body.reduce((acc, map) => acc && map.displayable, true);
					expect(allMapsAreDisplayable).to.be.true;
				});
			}
		}
	});

	mocha.it('returns details on a single map by ID', async () => {
		const conn = testDB.getConnection();
		await new Map(undefined, 'Map 1', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 0.0, 0.0).insert(conn);
		const map2 = new Map(undefined, 'Map 2', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 0.0, 0.0);
		await map2.insert(conn);

		const res = await chai.request(app).get(`/api/maps/${map2.id}`);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.property('id', map2.id);
		expect(res.body).to.have.property('name', 'Map 2');
	});

	mocha.it('responds appropriately when the meter in question does not exist', async () => {
		const conn = testDB.getConnection();
		const map = new Map(undefined, 'Map', true, null, 'default', moment('2000-10-10'), origin, opposite, 'placeholder', 0.0, 0.0);
		await map.insert(conn);

		const res = await chai.request(app).get(`/api/maps/${map.id + 1}`);
		expect(res).to.have.status(500);
	});
});
