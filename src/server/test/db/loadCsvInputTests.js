/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const { mocha, expect, testDB } = require('../common');
const readCsv = require('../../services/pipeline-in-progress/readCsv');
const Reading = require('../../models/Reading');
const Meter = require('../../models/Meter');
const Unit = require('../../models/Unit');
const path = require('path');
const loadCsvInput = require('../../services/pipeline-in-progress/loadCsvInput');

mocha.describe('PIPELINE: Load data from csv file', () => {
	const testFilePath = path.join(__dirname, 'data', 'test-readings.csv');
	function mapRowsToModel(row) {
		const reading = row[0];
		const endTimestamp = moment(row[1], 'HH:mm:ss MM/DD/YYYY');
		const startTimestamp = moment(endTimestamp).subtract(30, 'minute');
		return [reading, startTimestamp, endTimestamp];
	}
	mocha.it('as array', async () => {
		const conn = testDB.getConnection();
		const arrayInput = await readCsv(testFilePath);
		const unit = new Unit(undefined, 'Unit', 'Unit Id', Unit.unitRepresentType.UNUSED, 1000, 
						Unit.unitType.UNIT, 1, 'Unit Suffix', Unit.displayableType.ALL, true, 'Unit Note');
		const arrayMeter = new Meter(undefined, 'test_array', 1, true, true, Meter.type.MAMAC, null, undefined, 'test_array', null, 
									null, false, false, '00:00:00', '23:59:59.999999', 0, 0, 1, 'increasing', false, 0.0, moment(0), moment(0), 1, 1);
		await unit.insert(conn);
		await arrayMeter.insert(conn);
		// Return value is ignored for now.
		await loadCsvInput(testFilePath, arrayMeter.id, mapRowsToModel, 'increasing', 1, false, false, '0:00:00', '0:00:00',
			0, 0, false, false, false, undefined, conn);
		const result = await Reading.getAllByMeterID(arrayMeter.id, conn);
		expect(result.length).to.equal(arrayInput.length);
		let i = 0;
		result.map(reading => {
			expect(reading.meterID).to.equal(arrayMeter.id);
			expect(reading.reading).to.equal(parseInt(arrayInput[i][0]));
			expect(reading.endTimestamp.format()).to.equal(moment(arrayInput[i][1], 'HH:mm:ss MM/DD/YYYY').format());
			expect(reading.startTimestamp.format()).to.equal((moment(arrayInput[i][1], 'HH:mm:ss MM/DD/YYYY').subtract(30, 'minute')).format());
			++i;
		});
	});
});
