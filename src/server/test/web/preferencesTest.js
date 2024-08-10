/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

mocha.describe('preferences API', () => {
	mocha.describe('modification api', () => {
		mocha.describe('edit endpoint', () => {
			mocha.it('should accept requests from Admin role', async () => {
				let res = await chai.request(app).post('/api/login')
					.send({ username: testUser.username, password: testUser.password });
				expect(res).to.have.status(200);
				const token = res.body.token;
				const preferences = {
					displayTitle: 'title',
					defaultChartToRender: 'line',
					defaultBarStacking: true,
					defaultLanguage: 'en',
					defaultWarningFileSize: 5,
					defaultFileSizeLimit: 25,
					defaultAreaNormalization: true,
					defaultAreaUnit: 'meters',
					defaultMeterReadingFrequency: '1:13:17'
				}
				res = await chai.request(app).post('/api/preferences').set('token', token).send({ preferences });
				expect(res).to.have.status(200);
			});

			mocha.describe('Non-Admin roles: ', () => {
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
						mocha.it(`should reject requests from ${role}`, async () => {
							let res = await chai.request(app).post('/api/preferences').set('token', token);
							expect(res).to.have.status(403);
						});
					}
				}
			});
		});
	});
})