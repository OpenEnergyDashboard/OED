/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect } = require('../common');
const convertToReadings = require('../../services/pipeline-in-progress/convertToReadings');
const Reading = require('../../models/Reading');
const day = require('day');

mocha.describe('PIPELINE: Convert raw data to readings', () => {
	mocha.it('array of reading & day to array of Reading values', async () => {
		let sampleArray = [ [ 0, day('1970-01-01 00:00:00'), day('1980-01-01 00:00:00')],
							[ 1, day('1970-01-01 00:00:01'), day('2000-01-01 00:00:01')],
							[ 2, day('1999-01-01 00:00:00'), day('2000-01-01 00:00:00')]];
		let i = 0;
		convertToReadings(sampleArray, 'testing', undefined)
						.map(reading => {
							expect(reading.meterID).to.equal('testing');
							expect(reading.reading).to.equal(sampleArray[i][0]);
							expect(reading.startTimestamp.format()).to.equal(sampleArray[i][1].format());
							expect(reading.endTimestamp.format()).to.equal(sampleArray[i][2].format());
							++i;
						});
	});
});
