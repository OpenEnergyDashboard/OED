/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');
const moment = require('moment');
const Reading = require('../../models/Reading');
const validateData = require('../../services/validateData');

mocha.describe('Validate Data', () => {
	mocha.it('detects out-of-bound data', async () => {
		const minVal = 10;
		const maxVal = 20;
		var readingVals = [9, 10, 21, 20, -Number.MAX_VALUE, 15, Number.MAX_VALUE];
		const results = readingVals.map(val => new Reading(
			undefined,
			val,
			moment('1970-01-01 00:00:00'),
			moment('1970-01-01 01:00:00')
		)).map(reading => validateData(reading, minVal, maxVal));
		for (let i = 0; i < 7; ++i) {
			if (i % 2 === 0) {
				expect(results[i]).to.equal(false);
			} else {
				expect(results[i]).to.equal(true);
			}
		}
	});
});
