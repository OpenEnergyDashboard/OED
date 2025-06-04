/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const { mocha, expect, testDB } = require('../common');
const Reading = require('../../models/Reading');
const Meter = require('../../models/Meter');
const loadArrayInput = require('../../services/pipeline-in-progress/loadArrayInput');

mocha.describe('PIPELINE: Load data from array', () => {
	mocha.it('valid data input', async () => {
		const conn = testDB.getConnection();
		// Does not set may meter values but okay since getting readings directly.
		const meter = new Meter(undefined, 'test_insert_array', 12345, true, true, Meter.type.MAMAC, null, undefined);
		await meter.insert(conn);
		const arrayInput = [[1, '17:00:00 1/24/20'],
		[2, '18:00:00 1/24/20'],
		[3, '19:00:00 1/24/20'],
		[4, '20:00:00 1/24/20'],
		[5, '21:00:00 1/24/20']];
		const readingDuration = 30;
		// Ignore return value for now.
		await loadArrayInput(arrayInput,
			meter.id,
			row => {
				const reading = row[0];
				// Need to work in UTC time since that is what the database returns and comparing
				// to database values. Done in all moment objects in this test.
				const endTimestamp = moment.utc(row[1], 'HH:mm:ss MM/DD/YYYY');
				const startTimestamp = moment.utc(endTimestamp).subtract(readingDuration, 'minute');
				return [reading, startTimestamp, endTimestamp];
			},
			'increasing',
			1,
			false,
			false,
			'0:00:00',
			'0:00:00',
			0,
			0,
			false,
			false,
			undefined,
			conn,
			false,
			false,
			false);
		const result = await Reading.getAllByMeterID(meter.id, conn);
		expect(result.length).to.equal(5);
		let i = 0;
		result.map(reading => {
			expect(reading.meterID).to.equal(meter.id);
			expect(reading.reading).to.equal(arrayInput[i][0]);
			expect(reading.endTimestamp.format()).to.equal(moment.utc(arrayInput[i][1], 'HH:mm:ss MM/DD/YYYY').format());
			expect(reading.startTimestamp.format()).to.equal((moment.utc(arrayInput[i][1], 'HH:mm:ss MM/DD/YYYY').subtract(readingDuration, 'minute')).format());
			++i;
		});
	});
});
