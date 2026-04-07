/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app, testUser } = require('../common');
const { HTTP_CODE } = require('../../util/readingsUtils');

mocha.describe('Session Invalidation Security', () => {
	const LOGIN_ENDPOINT = '/api/login';
	const LOGOUT_ENDPOINT = '/api/login/logout';
	const VERIFY_ENDPOINT = '/api/verification';
	const PROTECTED_ENDPOINT = '/api/users';

	async function loginAndGetToken() {
		const res = await chai.request(app)
			.post(LOGIN_ENDPOINT)
			.send({
				username: testUser.username,
				password: testUser.password
			});

		expect(res).to.have.status(HTTP_CODE.OK);
		expect(res.body).to.have.property('token');
		return res.body.token;
	}

	mocha.it('should verify a valid token before logout', async () => {
		const token = await loginAndGetToken();

		const verifyRes = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token });

		expect(verifyRes).to.have.status(HTTP_CODE.OK);
		expect(verifyRes.body).to.deep.equal({ success: true });
	});

	mocha.it('should invalidate a token after logout', async () => {
		const token = await loginAndGetToken();

		const logoutRes = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({ token });

		expect(logoutRes).to.have.status(HTTP_CODE.OK);
		expect(logoutRes.body).to.have.property('success', true);
		expect(logoutRes.body).to.have.property('message', 'Logout successful.');

		const verifyRes = await chai.request(app)
			.post(VERIFY_ENDPOINT)
			.send({ token });

		expect(verifyRes).to.have.status(HTTP_CODE.UNAUTHORIZED);
		expect(verifyRes.body).to.have.property('success', false);
		expect(verifyRes.body).to.have.property('message', 'Token invalidated.');
	});

	mocha.it('should allow repeated logout with an already invalidated token', async () => {
		const token = await loginAndGetToken();

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
		const token = await loginAndGetToken();

		const beforeLogoutRes = await chai.request(app)
			.get(PROTECTED_ENDPOINT)
			.set('token', token);

		expect(beforeLogoutRes).to.have.status(HTTP_CODE.OK);

		const logoutRes = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({ token });

		expect(logoutRes).to.have.status(HTTP_CODE.OK);

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
		const token = await loginAndGetToken();

		const res = await chai.request(app)
			.post(LOGOUT_ENDPOINT)
			.send({
				token,
				extraField: 'should be rejected'
			});

		expect(res).to.have.status(HTTP_CODE.BAD_REQUEST);
	});
});
