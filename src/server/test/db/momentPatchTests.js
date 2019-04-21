/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { mocha, expect, testDB } = require('../common');
const moment = require('moment');

mocha.describe('MomentJS patching', () => {
	mocha.it('patches moment durations', async () => {
		const conn = testDB.getConnection();
		const result = await conn.one('SELECT pg_typeof(${interval})', { interval: moment.duration(1, 'days') });
		const type = result.pg_typeof;
		expect(type).to.equal('interval');
	});

	mocha.it('patches arrays of moment durations', async () => {
		const conn = testDB.getConnection();
		const result = await conn.one('SELECT pg_typeof(${intervalArr})', { intervalArr: [moment.duration(1, 'days'), moment.duration(2, 'days')] });
		const type = result.pg_typeof;
		expect(type).to.equal('interval[]');
	});

	mocha.it('patches returned durations to moment duration types', async () => {
		const conn = testDB.getConnection();
		const duration = moment.duration(1, 'days');
		const { returned } = await conn.one('SELECT ${duration} AS returned', { duration });
		expect(moment.isDuration(returned)).to.equal(true);
	});

	mocha.it('patches durations to the correct value', async () => {
		const conn = testDB.getConnection();
		const duration = moment.duration(1, 'days');
		const { returned } = await conn.one('SELECT ${duration} as returned', { duration });
		expect(duration.toISOString()).to.equal(returned.toISOString());
	});
});
