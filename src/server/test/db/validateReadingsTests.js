/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect } = require('../common');
const { checkDate, checkValue, checkIntervals} = require('../../services/pipeline-in-progress/validateReadings');
const Reading = require('../../models/Reading');
const moment = require('moment');

mocha.describe('PIPELINE: Validate Readings', () => {
	mocha.it('detects out-of-bound date', async () => {
		const minDate = moment('1970-01-01 00:00:00');
		const maxDate = moment('2000-01-01 00:00:00');
		// testing sequence: [in-bound, in-bound], [in-bound, later], [in-bound, in-bound], [earlier, in-bound]
		let testingDates = [[ moment('1970-01-01 00:00:00'), moment('1980-01-01 00:00:00') ],
							[ moment('1970-01-01 00:00:01'), moment('2000-01-01 00:00:01') ],
							[ moment('1999-01-01 00:00:00'), moment('2000-01-01 00:00:00') ],
							[ moment('1950-01-01 00:00:00'), moment('1990-01-01 00:00:00') ]];
		const results = testingDates.map(date => new Reading(
			undefined,
			0,
			date[0],
			date[1]
		)).map(reading => checkDate([reading], minDate, maxDate, Number.MAX_VALUE));
		for (let i = 0; i < 4; ++i) {
			if (i % 2 === 0) {
				expect(results[i]).to.equal(true);
			} else {
				expect(results[i]).to.equal(false);
			}
		}
	});
	mocha.it('detects out-of-bound data', async () => {
		const minVal = 10;
		const maxVal = 20;
		// testing sequence: lower, in-bound, higher, in-bound, lower, in-bound, higher
		let readingVals = [9, 10, 21, 20, Number.NEGATIVE_INFINITY, 15, Number.POSITIVE_INFINITY];
		const results = readingVals.map(val => new Reading(
			undefined,
			val,
			moment('1970-01-01 00:00:00'),
			moment('1970-01-01 01:00:00')
		)).map(reading => checkValue([reading], minVal, maxVal, Number.MAX_VALUE));
		for (let i = 0; i < 7; ++i) {
			if (i % 2 === 0) {
				expect(results[i]).to.equal(false);
			} else {
				expect(results[i]).to.equal(true);
			}
		}
	});
	mocha.it('detects unequal intervals', async () => {
		let testing = [ new Reading(undefined, 0, moment('1970-01-01 00:00:00'), moment('1970-01-01 00:00:01')),
						new Reading(undefined, 0, moment('1970-01-01 00:01:00'), moment('1970-01-01 00:01:01')),
						new Reading(undefined, 0, moment('1970-01-01 00:04:00'), moment('1970-01-01 00:04:01'))];
		let result = checkIntervals(testing, 0);
		expect(result).to.equal(false);
	});
	mocha.it('detects equal intervals', async () => {
		let testing = [ new Reading(undefined, 0, moment('1970-01-01 00:00:00'), moment('1970-01-01 00:01:00')),
						new Reading(undefined, 0, moment('1970-01-01 00:01:00'), moment('1970-01-01 00:01:01')),
						new Reading(undefined, 0, moment('1970-01-01 00:01:30'), moment('1970-01-01 00:02:01'))];
		let result = checkIntervals(testing, 60);
		expect(result).to.equal(true);
	});
});
