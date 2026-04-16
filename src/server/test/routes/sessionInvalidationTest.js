/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const common = require('../common');
const { HTTP_CODE } = require('../../util/readingsUtils');
const jwt = require('jsonwebtoken');
const secretToken = require('../../config').secretToken;

const { chai, mocha, app, testUser, testUser2 } = common;

mocha.describe('Session Invalidation Security', () => {
	const LOGIN_ENDPOINT = '/api/login';
	const LOGOUT_ENDPOINT = '/api/login/logout';
	const VERIFY_ENDPOINT = '/api/verification';
	const PROTECTED_ENDPOINT = '/api/users';

	let token;

	async function loginAndGetToken(user) {
		const res = await chai.request(app)
			.post(LOGIN_ENDPOINT)
			.send({
				username: user.username,
				password: user.password
			});

		expect(res).to.have.status(HTTP_CODE.OK);
		expect(res.body).to.have.property('token');
		return res.body.token;
	}

	mocha.beforeEach(async () => {
		token = await loginAndGetToken(testUser);
	});

	mocha.it('should verify a valid token before logout', async () => {
		const verifyRes = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token });

		expect(verifyRes).to.have.status(HTTP_CODE.OK);
		expect(verifyRes.body).to.have.property('success', true);
		expect(verifyRes.body).to.not.have.property('message');
	});

	mocha.it('should invalidate a token after logout', async () => {
		const beforeVerify = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token });

		expect(beforeVerify).to.have.status(HTTP_CODE.OK);
		expect(beforeVerify.body).to.have.property('success', true);

		const logoutRes = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({ token });

		expect(logoutRes).to.have.status(HTTP_CODE.OK);
		expect(logoutRes.body).to.have.property('success', true);

		const verifyRes = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token });

		expect(verifyRes).to.have.status(HTTP_CODE.UNAUTHORIZED);
		expect(verifyRes.body).to.have.property('success', false);
		expect(verifyRes.body).to.have.property('message', 'Token invalidated.');
	});

	mocha.it('should allow repeated logout with an already invalidated token', async () => {
		const firstLogoutRes = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({ token });

		expect(firstLogoutRes).to.have.status(HTTP_CODE.OK);
		expect(firstLogoutRes.body).to.have.property('success', true);

		const secondLogoutRes = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({ token });

		expect(secondLogoutRes).to.have.status(HTTP_CODE.OK);
		expect(secondLogoutRes.body).to.have.property('success', true);
		expect(secondLogoutRes.body).to.have.property('message', 'Logout successful.');
	});

	mocha.it('should reject an invalidated token on a protected route', async () => {
		const beforeLogoutRes = await chai.request(app)
			.get(PROTECTED_ENDPOINT)
			.set('token', token);

		expect(beforeLogoutRes).to.have.status(HTTP_CODE.OK);

		await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({ token });

		const afterLogoutRes = await chai.request(app)
			.get(PROTECTED_ENDPOINT)
			.set('token', token);

		expect(afterLogoutRes).to.have.status(HTTP_CODE.UNAUTHORIZED);
		expect(afterLogoutRes.body).to.have.property('success', false);
		expect(afterLogoutRes.body).to.have.property('message', 'Token invalidated.');
	});

	mocha.it('should require a token for logout', async () => {
		const res = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({});

		expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
	});

	mocha.it('should reject extra fields on logout', async () => {
		const res = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({
				token,
				extraField: 'should be rejected'
			});

		expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
	});

	mocha.it('should reject an expired token through normal JWT expiration handling', async () => {
		const expiredToken = jwt.sign(
			{ data: testUser.id },
			secretToken,
			{ expiresIn: 1 }
		);

		await new Promise(resolve => setTimeout(resolve, 1500));

		const res = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token: expiredToken });

		expect(res).to.have.status(HTTP_CODE.UNAUTHORIZED);
		expect(res.body).to.have.property('success', false);
		expect(res.body).to.have.property('message', 'Failed to authenticate token.');
	});

	mocha.it('should invalidate token for a non-admin user', async () => {
		const otherToken = await loginAndGetToken(testUser2);

		const beforeVerify = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token: otherToken });

		expect(beforeVerify).to.have.status(HTTP_CODE.OK);
		expect(beforeVerify.body).to.have.property('success', true);

		const logoutRes = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({ token: otherToken });

		expect(logoutRes).to.have.status(HTTP_CODE.OK);
		expect(logoutRes.body).to.have.property('success', true);

		const verifyRes = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token: otherToken });

		expect(verifyRes).to.have.status(HTTP_CODE.UNAUTHORIZED);
		expect(verifyRes.body).to.have.property('success', false);
		expect(verifyRes.body).to.have.property('message', 'Token invalidated.');
	});
});
