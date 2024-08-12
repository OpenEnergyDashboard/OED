/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the login form API. */

const { chai, mocha, expect, app, testUser } = require('../common');

const VERSION = require('../../version');

mocha.describe('login API', () => {
	mocha.it('returns JWT for a successful login attempt', async () => {
		const res = await chai.request(app).post('/api/login')
			.send({ username: testUser.username, password: testUser.password });
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		expect(res.body).to.have.property('token');
	});
	mocha.it('returns 401 for a wrong password', async () => {
		const res = await chai.request(app).post('/api/login')
			.send({ username: testUser.username, password: testUser.password + 'wrong' });
		expect(res).to.have.status(401);
		expect(res.body).not.to.have.property('token');
	});
	mocha.it('returns 401 for a wrong user', async () => {
		const res = await chai.request(app).post('/api/login')
			.send({ username: testUser.username + 'nope', password: testUser.password });
		expect(res).to.have.status(401);
		expect(res.body).not.to.have.property('token');
	});
});

mocha.describe('verification API', () => {
	mocha.it('returns 200 when passed a valid token', async () => {
		const res = await chai.request(app).post('/api/login')
			.send({ username: testUser.username, password: testUser.password });
		expect(res).to.have.status(200);
		expect(res).to.be.json;
		token = res.body.token;

		const res2 = await chai.request(app).post('/api/verification')
			.send({token: token});
		expect(res2).to.have.status(200);
	});
});
