/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const { mocha, expect } = require('../common');
const handleCumulative = require('../../services/pipeline-in-progress/handleCumulative');
const Reading = require('../../models/Reading');
const moment = require('moment');

mocha.describe('PIPELINE: Handle cumulative', () => {
	let sampleArray = [[10000, moment('1970-01-01 00:00:00'), moment('1970-01-01 00:00:30')]];
	const valGap = 2;
	const timeGap = 30;
	for (let i = 1; i < 12; ++i) {
		sampleArray.push([sampleArray[i - 1][0] - valGap * i,
						sampleArray[i - 1][1].subtract(timeGap * i, 'second'),
						sampleArray[i - 1][2].subtract(timeGap * i, 'second')]);
	}
	mocha.describe('with non-duplicated value', () => {
		result = handleCumulative(sampleArray, 1);
		mocha.it('returned array length', async () => {
			expect(result.length).to.equal(sampleArray.length - 1);
		});
		mocha.it('reading values', async () => {
			let i = 1;
			result.map(row => {
				expect(row[0]).to.equal(valGap * i);
				++i;
			});
		});
		mocha.it('startTimeStamps', async () => {
			let i = 0;
			result.map(row => {
				expect(row[1].format()).to.equal(sampleArray[i][1].format());
				++i;
			});
		});
		mocha.it('endTimeStamps', async () => {
			let i = 0;
			result.map(row => {
				expect(row[2].format()).to.equal(sampleArray[i][2].format());
				++i;
				});
		});
	});
	mocha.describe('with duplicated value', () => {
		mocha.it('returned array length', async () => {
			for (let repetition = 2; repetition < 7; ++repetition) {
				result = handleCumulative(sampleArray, repetition);
				expect(result.length).to.equal(Math.floor((sampleArray.length - 1) / repetition));
			}
		});
		mocha.it('reading values', async () => {
			for (let repetition = 2; repetition < 7; ++repetition) {
				result = handleCumulative(sampleArray, repetition);
				let k = 0;
				for (let i = 1; i < 12; ++i) {
					if ((i - repetition) % repetition === 0) {
						expect(result[k][0]).to.equal(sampleArray[i - repetition][0] - sampleArray[i][0]);
						++k;
					}
				}
			}
		});
		mocha.it('startTimeStamps', async () => {
			for (let repetition = 2; repetition < 7; ++repetition) {
				result = handleCumulative(sampleArray, repetition);
				let k = 0;
				for (let i = 1; i < 12; ++i) {
					if ((i - repetition) % repetition === 0) {
						expect(result[k][1].format()).to.equal(sampleArray[i][1].format());
						++k;
					}
				}
			}
		});
		mocha.it('endTimeStamps', async () => {
			for (let repetition = 2; repetition < 7; ++repetition) {
				result = handleCumulative(sampleArray, repetition);
				let k = 0;
				for (let i = 1; i < 12; ++i) {
					if ((i - repetition) % repetition === 0) {
						expect(result[k][2].format()).to.equal(sampleArray[i - repetition][2].format());
						++k;
					}
				}
			}
		});
	});
});
