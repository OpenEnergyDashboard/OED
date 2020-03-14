/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect } = require('../common');
const convertToReadings = require('../../services/Pipeline/convertToReadings');
const Reading = require('../../models/Reading');

mocha.describe('Convert array of values to array of Readings', () => {
	mocha.it('Convert array of array to array of Reading values', async () => {
		let sampleArray = [[0, moment('1980-01-01 00:00:00'), moment('1990-01-01 00:00:00')],
							[1, moment('2000-01-01 00:00:00'), moment('2000-01-01 00:00:00')],
							[2, moment('2010-01-01 00:00:00'), moment('2020-01-01 00:00:00')]];
		let minDate = moment('1970-01-01 00:00:00');
		let maxDate = moment('2970-01-01 00:00:00');
		let result = convertToReadings(sampleArray, undefined, Number.MAX_VALUE, Number.MIN_VALUE, minDate, maxDate);
		for (let i = 0; i < result.length; ++i) {
			expect(result[i].reading).to.equal(sampleArray[i][0]);
			expect(result[i].startTimeStamp).to.equal(sammpleArray[i][2]);
			expect(result[i].endTimeStamp).to.equal(sampleArray[i][2]);
		}
	});
});
