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
		let sampleArray = [ [ 0, moment('00:00:00 01/01/1999', 'HH:mm:ss MM/DD/YYYY'), moment('00:00:03 01/01/1999', 'HH:mm:ss MM/DD/YYYY')],
							[ 1, moment('00:00:00 01/02/1999', 'HH:mm:ss MM/DD/YYYY'), moment('00:00:03 01/02/1999', 'HH:mm:ss MM/DD/YYYY')],
							[ 2, moment('00:00:00 01/03/1999', 'HH:mm:ss MM/DD/YYYY'), moment('00:00:03 01/03/1999', 'HH:mm:ss MM/DD/YYYY')]];
		let result = convertToReadings(sampleArray, undefined, -Number.MAX_VALUE, Number.MAX_VALUE, null, null, null, 0);
		expect(result.length).to.equal(3);
		console.log(result[0].reading);
		console.log(result[0].startTimeStamp.format());
		console.log(result[0].endTimeStamp.format());
		for (let i = 0; i < result.length; ++i) {
			expect(result[i].reading).to.equal(sampleArray[i][0]);
			expect(result[i].startTimeStamp).to.equal(sampleArray[i][1]);
			expect(result[i].endTimeStamp).to.equal(sampleArray[i][2]);
		}
	});
});
