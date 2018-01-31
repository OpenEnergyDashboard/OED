/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;

const mocha = require('mocha');

mocha.describe('MomentJS patching', () => {
	mocha.beforeEach(recreateDB);

	mocha.it('patches moment durations', async () => {
		const result = await db.one('SELECT pg_typeof(${interval})', { interval: moment.duration(1, 'days') });
		const type = result.pg_typeof;
		expect(type).to.equal('interval');
	});

	mocha.it('patches arrays of moment durations', async () => {
		const result = await db.one('SELECT pg_typeof(${intervalArr})', { intervalArr: [moment.duration(1, 'days'), moment.duration(2, 'days')] });
		const type = result.pg_typeof;
		expect(type).to.equal('interval[]');
	});

	mocha.it('patches returned durations to moment duration types', async () => {
		const duration = moment.duration(1, 'days');
		const { returned } = await db.one('SELECT ${duration} AS returned', { duration });
		expect(moment.isDuration(returned)).to.equal(true);
	});

	mocha.it('patches durations to the correct value', async () => {
		const duration = moment.duration(1, 'days');
		const { returned } = await db.one('SELECT ${duration} as returned', { duration });
		expect(duration.toISOString()).to.equal(returned.toISOString());
	});
});
