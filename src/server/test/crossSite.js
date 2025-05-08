/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests ???. */

// Run in OED Docker web container terminal/shell: npm run testsome src/server/test/crossSite.js

const { chai, mocha, expect, app, testUser } = require('./common');

mocha.describe('Cross site', () => {
    mocha.it('test 1', async () => {
        const res = await chai.request(app).post('/api/csv/readings')
            .field('email', testUser.username)
            .field('password', testUser.password)
            .field('meterName', "&lt;img&#32;src&#47;onerror&#61;alert&#40;document&#46;domain&#41;&gt;")
            .field('timeSort', "increasing")
			.field('duplications', "")
			.field('cumulative', "no")
			.field('cumulativeReset', "yes")
			.field('cumulativeResetStart', "")
			.field('cumulativeResetEnd', "")
			.field('lengthGap', "")
			.field('lengthVariation', "")
			.field('endOnly', "no")
			.field('gzip', "no")
			.field('headerRow', "yes")
			.field('refreshReadings', "no")
			.field('update', "no")
			.field('honorDst', "no")
			.field('relaxedParsing', "no")
			.field('csvfile', "file")
			.attach('CSV', 'src/server/test/something.csv');
        console.log('res.text: ', res.text);
        // expect(res).to.have.status(500); should be a 500 code after all fields are inputed
     //expect(res).to.be.json;
    });
});
