/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const Meter = require('../../models/Meter');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const Point = require('../../models/Point');
const gps = new Point(90, 45);

mocha.describe('meters API', () => {
	mocha.it('returns nothing with no meters present', async () => {
		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(0);
	});

	mocha.it('returns all visible meters', async () => {
		const conn = testDB.getConnection();
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps).insert(conn);
		await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ2', gps).insert(conn);
		await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ3', gps).insert(conn);
		await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, 'TZ4', gps).insert(conn);

		const res = await chai.request(app).get('/api/meters');
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.lengthOf(3);

		for (let i = 0; i < 3; i++) {
			const meter = res.body[i];
			expect(meter).to.have.property('id');
			expect(meter).to.have.property('name', `Meter ${i + 1}`);
			expect(meter).to.have.property('gps');
			expect(meter.gps).to.have.property('latitude', gps.latitude);
			expect(meter.gps).to.have.property('longitude', gps.longitude);
			expect(meter).to.have.property('ipAddress', null);
			expect(meter).to.have.property('enabled', true);
			expect(meter).to.have.property('displayable', true);
			expect(meter).to.have.property('meterType', null);
			expect(meter).to.have.property('timeZone', null);
		}
	});
	mocha.describe('Admin role:', () => {
		let token;
		mocha.before(async () => {
			let res = await chai.request(app).post('/api/login')
				.send({ email: testUser.email, password: testUser.password });
			token = res.body.token;
		});
		mocha.it('returns all meters', async () => {
			const conn = testDB.getConnection();
			await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps).insert(conn);
			await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ2', gps).insert(conn);
			await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ3', gps).insert(conn);
			await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, 'TZ4', gps).insert(conn);

			const res = await chai.request(app).get('/api/meters').set('token', token);
			expect(res).to.have.status(200);
			expect(res).to.be.json;
			expect(res.body).to.have.lengthOf(4);

			for (let i = 0; i < 4; i++) {
				const meter = res.body[i];
				expect(meter).to.have.property('id');
				expect(meter).to.have.property('gps');
				expect(meter.gps).to.have.property('latitude', gps.latitude);
				expect(meter.gps).to.have.property('longitude', gps.longitude);
				if (i < 3) {
					expect(meter).to.have.property('name', `Meter ${i + 1}`);
					expect(meter).to.have.property('displayable', true);
				} else {
					expect(meter).to.have.property('name', 'Not Visible');
					expect(meter).to.have.property('displayable', false);
				}
				expect(meter).to.have.property('ipAddress', '1.1.1.1');
				expect(meter).to.have.property('enabled', true);
				expect(meter).to.have.property('meterType', Meter.type.MAMAC);
				expect(meter).to.have.property('timeZone', 'TZ' + (i + 1));
			}
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
						.send({ email: unauthorizedUser.email, password: unauthorizedUser.password });
					token = res.body.token;
				});

				mocha.it('should only return visible meters and visible data', async () => {
					const conn = testDB.getConnection();
					await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ1', gps).insert(conn);
					await new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ2', gps).insert(conn);
					await new Meter(undefined, 'Meter 3', '1.1.1.1', true, true, Meter.type.MAMAC, 'TZ3', gps).insert(conn);
					await new Meter(undefined, 'Not Visible', '1.1.1.1', true, false, Meter.type.MAMAC, 'TZ4', gps).insert(conn);

					const res = await chai.request(app).get('/api/meters').set('token', token);
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.lengthOf(3);

					for (let i = 0; i < 3; i++) {
						const meter = res.body[i];
						expect(meter).to.have.property('id');
						expect(meter).to.have.property('gps');
						expect(meter.gps).to.have.property('latitude', gps.latitude);
						expect(meter.gps).to.have.property('longitude', gps.longitude);
						expect(meter).to.have.property('ipAddress', null);
						expect(meter).to.have.property('enabled', true);
						expect(meter).to.have.property('displayable', true);
						expect(meter).to.have.property('meterType', null);
						expect(meter).to.have.property('timeZone', null);

						// Copied from /src/server/routes/meters.js
						// TODO: remove this line when usages of meter.name are replaced with meter.identifer
						// Without this, things will break for non-logged in users because we currently rely on
						// the internal name being available. As noted in #605, the intent is to not send the
						// name to a user if they are not logged in.
						expect(meter).to.have.property('name', `Meter ${i + 1}`);
					}
				});

				mocha.it(`should reject requests from ${role} to edit meters`, async () => {
					let res = await chai.request(app).post('/api/meters/edit').set('token', token);
					expect(res).to.have.status(403);
				});
			}
		}
	});

	mocha.it('returns details on a single meter by ID', async () => {
		const conn = testDB.getConnection();
		await new Meter(undefined, 'Meter 1', '1.1.1.1', true, true, Meter.type.MAMAC, null, gps).insert(conn);
		const meter2 = new Meter(undefined, 'Meter 2', '1.1.1.1', true, true, Meter.type.MAMAC, null, gps);
		await meter2.insert(conn);

		const res = await chai.request(app).get(`/api/meters/${meter2.id}`);
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.property('id', meter2.id);
		expect(res.body).to.have.property('name', 'Meter 2');
		expect(res.body).to.have.property('gps');
		expect(res.body.gps).to.have.property('latitude', gps.latitude);
		expect(res.body.gps).to.have.property('longitude', gps.longitude);
	});

	mocha.it('responds appropriately when the meter in question does not exist', async () => {
		const conn = testDB.getConnection();
		const meter = new Meter(undefined, 'Meter', '1.1.1.1', true, true, Meter.type.MAMAC, null, gps);
		await meter.insert(conn);

		const res = await chai.request(app).get(`/api/meters/${meter.id + 1}`);
		expect(res).to.have.status(500);
	});
});
