/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect } = require('../common');
const convertToReadings = require('../../services/Pipeline/convertToReadings');
const Reading = require('../../models/Reading');
const moment = require('moment');

mocha.describe('Convert data', () => {
	mocha.it('array of reading & moment to array of Reading values', async () => {
		let sampleArray = [ [ 0, moment('1970-01-01 00:00:00'), moment('1980-01-01 00:00:00')],
							[ 1, moment('1970-01-01 00:00:01'), moment('2000-01-01 00:00:01')],
							[ 2, moment('1999-01-01 00:00:00'), moment('2000-01-01 00:00:00')]];
		const conditionSet = {
				'minVal': -Number.MAX_VALUE, 
				'maxVal': Number.MAX_VALUE, 
				'minDate': null, 
				'maxDate': null,
				'interval': null,
				'maxErrors': 10};
		let i = 0;
		convertToReadings(sampleArray, "testing", conditionSet)
						.map(reading => {
							expect(reading.meterID).to.equal('testing');
							expect(reading.reading).to.equal(sampleArray[i][0]);
							expect(reading.startTimestamp.format()).to.equal(sampleArray[i][1].format());
							expect(reading.endTimestamp.format()).to.equal(sampleArray[i][2].format());
							++i;
						});
	});
});
