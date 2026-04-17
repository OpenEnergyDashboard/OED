/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file currently only tests the login route rate limiting functionality.
   It ensures that repeated login attempts are blocked after
   exceeding the configured rate limit. */

// TODO: Create additonal rate limits tests for other OED Routes

const { HTTP_CODE } = require('../util/readingsUtils');
const { chai, mocha, expect, app } = require('../test/common');
const { todo } = require('node:test');

mocha.describe('Login Rate Limit', () => {
	mocha.it('Should block repeated login attempts with 429', async () => {
			const first = await chai.request(app)
				.post('/api/login')
				.send({
					username: 'invalidUser',
					password: 'invalidPassword'
				});

			//First request that makes it through to authentication
			expect(first).to.have.status(HTTP_CODE.UNAUTHORIZED);
	
			const second = await chai.request(app)
				.post('/api/login')
				.send({
					username: 'invalidUser',
					password: 'invalidPassword'
				});

			//Second request that triggers the rate limit of 1 request per 4 seconds
			expect(first).to.have.status(HTTP_CODE.TOO_MANY_REQUESTS);
			expect(second.text).to.include('Too many requests');
	});
});
