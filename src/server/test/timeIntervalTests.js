/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const mocha = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const { TimeInterval } = require('../../common/TimeInterval');


mocha.describe('Time Intervals', () => {
	mocha.it('can be created', async () => {
		// moment okay since set to UTC.
		const start = moment('1970-01-01T00:01:00Z');
		const end = moment('2069-12-31T00:01:00Z');
		const ti = new TimeInterval(start, end);
		expect(ti.toString()).to.equal('1970-01-01T00:01:00Z_2069-12-31T00:01:00Z');
	});

});
