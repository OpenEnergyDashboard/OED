/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

mocha.describe('Preferences API', () => {
	mocha.describe('with admin role', async () => {
		mocha.it('should accept request to edit', async () => {
			let res = await chai.request(app).post('/api/login')
				.send({ email: testUser.email, password: testUser.password });
			expect(res).to.have.status(200);
			const token = res.body.token;
			const preferences = {
				displayTitle: 'title',
				defaultChartToRender: 'line',
				defaultBarStacking: true,
				defaultLanguage: 'en'
			}
			res = await chai.request(app).post('/api/preferences').set('token', token).send({ preferences });
			expect(res).to.have.status(200);
		});

	});
	mocha.describe('without admin authorization level', async () => {
		try {
			/**
			 * Loop User roles for non admin users
			 */
			for (const role in User.role) {
				if (User.role[role] !== User.role.ADMIN) {
					mocha.it(`should reject requests from ${role} to edit meters`, async () => {
						const conn = testDB.getConnection();
						const password = 'password';
						const hashedPassword = await bcrypt.hash(password, 10);
						const notAdmin = new User(undefined, 'notAdmin@example.com', hashedPassword, User.role[role]);
						await notAdmin.insert(conn);
						notAdmin.password = password;

						let res;
						// login
						res = await chai.request(app).post('/api/login')
							.send({ email: notAdmin.email, password: notAdmin.password });
						const token = res.body.token;
						expect(res).to.have.status(200);
						// edit
						res = await chai.request(app).post('/api/preferences').set('token', token);
						expect(res).to.have.status(401);
					});
				}
			}
		} catch (error) {
			console.log(error);
		}
	});
})