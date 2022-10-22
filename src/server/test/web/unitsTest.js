/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving units, by artificially
 * inserting units prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const Unit = require('../../models/Unit');

mocha.it('returns nothing with no units present', async () => {
    const res = await chai.request(app).get('/api/units');
    expect(res).to.have.status(200);
    expect(res).to.be.json;
    expect(res.body).to.have.lengthOf(0);
});
