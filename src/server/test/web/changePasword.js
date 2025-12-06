/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the changePassword form API. */

const { chai, mocha, expect, app, testUser } = require('../common');

const VERSION = require('../../version');

mocha.describe('change password API', () => {
    mocha.it('returns JWT for a successful change password attempt', async () => {
        const res = await chai.request(app).post('/api/changePassword')
            .send({ currentPassword: testUser.currentPassword, newPassword: testUser.newPassword });
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.property('token');
    });
    mocha.it('returns 400 when current password is incorrect', async () => {
        const res = await chai.request(app).post('/api/changePassword')
            .send({ currentPassword: testUser.currentPassword + "wrong", newPassword: testUser.newPassword });
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('token');
    });
});