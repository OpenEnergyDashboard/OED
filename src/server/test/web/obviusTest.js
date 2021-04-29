/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

mocha.describe('Obvius API', () => {
	mocha.describe('upload: ', () => {
		mocha.describe('authorized roles (Admin or Obvius):', () => {
			mocha.it('should accept requests from Admin users', async () => {
				const res = await chai.request(app).post('/api/obvius').send({ email: testUser.email, password: testUser.password });
				expect(res).to.have.status(406); // this passes role verification but fails due to improper input
			});
			mocha.it('should accept requests from Obvius users', async () => {
				const conn = testDB.getConnection();
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obivus@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const res = await chai.request(app).post('/api/obvius').send({ email: obviusUser.email, password: obviusUser.password });
				expect(res).to.have.status(406); // this passes role verification but fails due to improper input
			});
		})
		mocha.describe('unauthorized roles:', async () => {
			for (const role in User.role) {
				if (User.role[role] !== User.role.ADMIN && User.role[role] !== User.role.OBVIUS) {
					mocha.it(`should reject requests from ${role}`, async () => {
						const conn = testDB.getConnection();
						const password = 'password';
						const hashedPassword = await bcrypt.hash(password, 10);
						const unauthorizedUser = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
						await unauthorizedUser.insert(conn);
						unauthorizedUser.password = password;
						const res = await chai.request(app).post('/api/obvius').send({ email: unauthorizedUser.email, password: unauthorizedUser.password });
						expect(res).to.have.status(401); // request should respond with http code of 401 for unauthorized request
					})
				}
			}
		});
	});
});
