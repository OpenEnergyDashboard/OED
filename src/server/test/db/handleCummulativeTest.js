/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect } = require('../common');
const handleCummulative = require('../../services/Pipeline/handleCummulative');
const Reading = require('../../models/Reading');
const moment = require('moment');

mocha.describe('Handle cummulative', () => {
	mocha.it('works with non-repeated values', async () => {
		let sampleArray = [[0, moment('1970-01-01 00:00:00'), moment('1970-01-01 00:00:30')]]
		const val_gap = 2;
		const time_gap = 30;
		for (let i = 1; i < 12; ++i) {
			sampleArray.push([sampleArray[i - 1][0] + val_gap, 
							sampleArray[i - 1][1].add(time_gap, 'second'),
							sampleArray[i - 1][2].add(time_gap, 'second')]);
		}
		result = handleCummulative(sampleArray, 0);
		expect(result.length).to.equal(sampleArray.length - 1);
		result.map(row => expect(row[0]).to.equal(gap));
	});
});
