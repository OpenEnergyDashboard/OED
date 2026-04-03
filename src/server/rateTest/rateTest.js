/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the login route rate limiting functionality.
   It ensures that repeated login attempts are blocked after
   exceeding the configured rate limit. */

/* Run in OED Docker web container terminal/shell:
npm run testsome src/server/test/routes/loginRateTest.js */

const { chai, mocha, expect, app } = require('../common');

mocha.describe('Login Rate Limit', () => {
	mocha.it('Should block repeated login attempts with 429', async () => {
            const first = await chai.request(app)
                .post('/api/login')
                .send({
                    username: 'invalidUser',
                    password: 'invalidPassword'
                });
            expect(first).to.have.status(401);
    
            const second = await chai.request(app)
                .post('/api/login')
                .send({
                    username: 'invalidUser',
                    password: 'invalidPassword'
                });
    
            expect(second).to.have.status(429);
            expect(second.text).to.include('Too many requests');

    });

});