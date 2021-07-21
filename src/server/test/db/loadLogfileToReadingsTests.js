/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Meter = require('../../models/Meter');
const { mocha, expect, testDB } = require('../common');
const demuxCsvWithSingleColumnTimestamps = require('../../services/obvius/csvDemux');
const loadLogfileToReadings = require('../../services/obvius/loadLogfileToReadings');

const csvData = `2001-01-01 00:00:00,0,100,7
2001-01-01 00:00:01,1,200,8
2001-01-01 00:00:02,2,400,9`;

const csvData2 = `0,100,7,2001-01-01 00:00:00
1,200,8,2001-01-01 00:00:01
2,400,9,2001-01-01 00:00:02`;

const csvDataIncons = `2001-01-01 00:00:00,,100
2001-01-01 00:00:01,1,200,8
2001-01-01 00:00:02,2,400,9`;

// In this CSV test data and all that follow that are being used by loadLogfileToReadings,
// the three values following the data are ignored so set to "x".
//tslint:disable max-line-length
const csvDataReal = `'2018-04-26 16:04:59',x,x,x,0,0,0,35304.57,0.42,0.49,0.65,0.65,491.97,284.75,0.75,0,0,0.42,1.00,1.00,0.65,489.86,491.38,494.65,284.17,284.90,285.20,0,0,2.25,60.01,47968.77,30384.27,0,0,0.64,0,0,0.49,0.46,0.57,0.73,20.51,8.93
'2018-04-26 16:34:23',x,x,x,160,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
'2018-04-26 16:53:17',x,x,x,0,0,0,35305.07,0.99,1.05,1.44,0.69,490.41,283.86,1.73,0.46,0,0.53,0.77,1.00,0.61,488.12,489.98,493.15,283.11,284.19,284.27,2.13,0,3.04,59.93,47969.52,30384.80,0.60,0,0.87,0.37,0,0.68,0.49,0.62,0.79,20.51,8.93
`;
//tslint:enable max-line-length

mocha.describe('demuxCsvWithSingleColumnTimestamps', async () => {
	mocha.it('should demultiplex CSVs with index time columns correctly', async () => {
		const r = demuxCsvWithSingleColumnTimestamps(csvData);
		expect(r).to.deep.equal([
			[
				['2001-01-01 00:00:00', 0],
				['2001-01-01 00:00:01', 1],
				['2001-01-01 00:00:02', 2]
			],
			[
				['2001-01-01 00:00:00', 100],
				['2001-01-01 00:00:01', 200],
				['2001-01-01 00:00:02', 400]
			],
			[
				['2001-01-01 00:00:00', 7],
				['2001-01-01 00:00:01', 8],
				['2001-01-01 00:00:02', 9]
			]
		]);
	});
	mocha.it('should demultiplex CSVs with differing time columns correctly', async () => {
		const r = demuxCsvWithSingleColumnTimestamps(csvData2, timesColumn = 3);
		expect(r).to.deep.equal([
			[
				['2001-01-01 00:00:00', 0],
				['2001-01-01 00:00:01', 1],
				['2001-01-01 00:00:02', 2]
			],
			[
				['2001-01-01 00:00:00', 100],
				['2001-01-01 00:00:01', 200],
				['2001-01-01 00:00:02', 400]
			],
			[
				['2001-01-01 00:00:00', 7],
				['2001-01-01 00:00:01', 8],
				['2001-01-01 00:00:02', 9]
			]
		]);
	});
	mocha.it('should demultiplex CSVs with missing or empty columns', async () => {
		const r = demuxCsvWithSingleColumnTimestamps(csvDataIncons);
		expect(r).to.deep.equal([
			[
				['2001-01-01 00:00:00', null],
				['2001-01-01 00:00:01', 1],
				['2001-01-01 00:00:02', 2]
			],
			[
				['2001-01-01 00:00:00', 100],
				['2001-01-01 00:00:01', 200],
				['2001-01-01 00:00:02', 400]
			],
			[
				['2001-01-01 00:00:00', null],
				['2001-01-01 00:00:01', 8],
				['2001-01-01 00:00:02', 9]
			]
		]);
	});
});

mocha.describe('loadLogfileToReadings', async () => {
	mocha.beforeEach(async () => {
		conn = testDB.getConnection();
	});
	mocha.it('doesn\'t crash and burn with real world data', async () => {
		await loadLogfileToReadings('000', '0.0.0.0', csvDataReal, conn);
	});
	mocha.it('adds the right number and type of meters', async () => {
		const csvDataAdd2Meters = '2001-01-01 00:00:00,x,x,x,10,10\n2001-01-02 00:00:00,x,x,x,20,20';
		await loadLogfileToReadings('000', '0.0.0.0', csvDataAdd2Meters, conn);

		let m = await Meter.getAll(conn);
		expect(m).to.have.lengthOf(2);

		let m1 = await Meter.getByName('000.0', conn);
		let m2 = await Meter.getByName('000.1', conn);
		expect(m1).to.have.property('type', Meter.type.OBVIUS);
		expect(m2).to.have.property('type', Meter.type.OBVIUS);
	});
	mocha.it('does not modify accepted data when multiple data points exist at one time', async () => {
		const csvDataAddDuplicate = '2001-01-01 00:00:00,x,x,x,10\n2001-01-01 01:00:00,x,x,x,10\n2001-01-01 01:00:00,x,x,x,20';
		await loadLogfileToReadings('000', '0.0.0.0', csvDataAddDuplicate, conn);

		let m1 = await Meter.getByName('000.0', conn);
		let readings = await m1.readings(conn);
		expect(readings).to.have.lengthOf(1);
		expect(readings[0]).to.have.property('reading', 10);
	});
	mocha.it('does not modify accepted data when the same data is submitted many times', async () => {
		const csvDataAddDuplicate = '2001-01-01 00:00:00,x,x,x,10\n2001-01-01 01:00:00,x,x,x,10\n2001-01-01 01:00:00,x,x,x,10';
		await loadLogfileToReadings('000', '0.0.0.0', csvDataAddDuplicate, conn);

		let m1 = await Meter.getByName('000.0', conn);
		let readings = await m1.readings(conn);
		expect(readings).to.have.lengthOf(1);
		expect(readings[0]).to.have.property('reading', 10);
	});
});
