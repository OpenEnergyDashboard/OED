/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

mocha.describe('Users API', () => {
	mocha.describe('with authentication', () => {
		let token;
		mocha.before(async () => {
			let res = await chai.request(app).post('/api/login')
				.send({ email: testUser.email, password: testUser.password });
			token = res.body.token;
		});
		mocha.it('retrieves users', async () => {
			const conn = testDB.getConnection();
			const password = await bcrypt.hash('password', 10);
			const csv = new User(undefined, 'csv@example.com', password, User.role.CSV);
			await csv.insert(conn);
			const res = await chai.request(app).get('/api/users').set('token', token);
			expect(res).to.have.status(200);
			expect(res.body).to.have.lengthOf(2);
		});
		mocha.it('successfully creates a user', async () => {
			const user = { email: 'a@ex.com', password: 'abc', role: User.role.CSV };
			const res = await chai.request(app).post('/api/users').set('token', token).send(user);
			expect(res).to.have.status(200);
			const conn = testDB.getConnection();
			const dbUser = await User.getByEmail(user.email, conn);
			expect(dbUser.role).to.equal(user.role);
		});
		mocha.it('rejects invalid user creation', async () => {
			const user = { email: 'a@ex.com', password: 'abc' };
			const res = await chai.request(app).post('/api/users').set('token', token).send(user);
			expect(res).to.have.status(400);
			const conn = testDB.getConnection();
			const users = await User.getAll(conn);
			expect(users).to.have.lengthOf(1);
		});
		mocha.it('update role', async () => {
			const conn = testDB.getConnection();
			const password = await bcrypt.hash('password', 10);
			const csv = new User(undefined, 'csv@example.com', password, User.role.CSV);
			await csv.insert(conn);
			const obvius = new User(undefined, 'obvius@example.com', password, User.role.OBVIUS);
			await obvius.insert(conn);
			const users = await User.getAll(conn);
			expect(users).to.have.lengthOf(3);
			const res = await chai.request(app).post('/api/users/edit').set('token', token).send({
				users: [
					{ email: csv.email, role: User.role.OBVIUS },
					{ email: obvius.email, role: User.role.CSV }
				]
			});
			expect(res).to.have.status(200);
			const modifiedCsv = await User.getByEmail(csv.email, conn);
			expect(modifiedCsv.role).to.equal(User.role.OBVIUS);
			const modifiedObvius = await User.getByEmail(obvius.email, conn);
			expect(modifiedObvius.role).to.equal(User.role.CSV);
		});
		mocha.it('deletes a user', async () => {
			const conn = testDB.getConnection();
			const password = await bcrypt.hash('password', 10);
			const csv = new User(undefined, 'csv@example.com', password, User.role.CSV);
			await csv.insert(conn);
			const user = await User.getByEmail(csv.email, conn);
			expect(user.email).to.equal(csv.email);
			const res = await chai.request(app).post('/api/users/delete').set('token', token).send({ email: csv.email });
			expect(res).to.have.status(200);
			expect((await User.getAll(conn)).filter(user => user === csv.email)).to.have.length(0);
		});
	});
	mocha.describe('without proper admin authorization level', async () => {
		let token;
		mocha.before(async () => {
			const conn = testDB.getConnection();
			const password = 'password';
			const hashedPassword = await bcrypt.hash(password, 10);
			const notAdmin = new User(undefined, 'notAdmin@example.com', hashedPassword, User.role.CSV);
			await notAdmin.insert(conn);
			notAdmin.password = password;
			let res = await chai.request(app).post('/api/login')
				.send({ email: notAdmin.email, password: notAdmin.password });
			token = res.body.token;
		});
		mocha.it('should reject request to delete a user with 401 unauthorized code', async () => {
			const res = await chai.request(app).post('/api/users/delete').set('token', token);
			expect(res).to.have.status(401);
		});
		mocha.it('should reject request to edit a user with 401 unauthorized code', async () => {
			const res = await chai.request(app).post('/api/users/edit').set('token', token);
			expect(res).to.have.status(401);
		});
		mocha.it('should reject a request to create a user with 401 unauthorized code', async () => {
			const res = await chai.request(app).post('/api/users/').set('token', token);
			expect(res).to.have.status(401);
		});
	});
})