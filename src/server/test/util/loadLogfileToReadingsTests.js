/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const loadLogfile = require("../../services/obvius/loadLogfileToReadings");

const chai = require('chai');

const expect = chai.expect;
const mocha = require('mocha');

const csvData = `1970-01-01 00:00:00,0,100,7
1970-01-01 00:00:01,1,200,8
1970-01-01 00:00:02,2,400,9`;

const csvData2 = `0,100,7,1970-01-01 00:00:00
1,200,8,1970-01-01 00:00:01
2,400,9,1970-01-01 00:00:02`;

mocha.describe('demuxCsvWithSingleColumnTimestamps', async () => {
	mocha.it('should demultiplex CSVs with index time columns correctly', async () => {
		const r = await loadLogfile.demuxCsvWithSingleColumnTimestamps(csvData);
		expect(r).to.deep.equal([
			[
				['1970-01-01 00:00:00', 0],
				['1970-01-01 00:00:01', 1],
				['1970-01-01 00:00:02', 2]
			],
			[
				['1970-01-01 00:00:00', 100],
				['1970-01-01 00:00:01', 200],
				['1970-01-01 00:00:02', 400]
			],
			[
				['1970-01-01 00:00:00', 7],
				['1970-01-01 00:00:01', 8],
				['1970-01-01 00:00:02', 9]
			]
		]);
	});
	mocha.it('should demultiplex CSVs with differing time columns correctly', async () => {
		const r = await loadLogfile.demuxCsvWithSingleColumnTimestamps(csvData2, timesColumn = 3);
		expect(r).to.deep.equal([
			[
				['1970-01-01 00:00:00', 0],
				['1970-01-01 00:00:01', 1],
				['1970-01-01 00:00:02', 2]
			],
			[
				['1970-01-01 00:00:00', 100],
				['1970-01-01 00:00:01', 200],
				['1970-01-01 00:00:02', 400]
			],
			[
				['1970-01-01 00:00:00', 7],
				['1970-01-01 00:00:01', 8],
				['1970-01-01 00:00:02', 9]
			]
		]);
	});
});
