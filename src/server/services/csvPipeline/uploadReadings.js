/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { CSVPipelineError } = require('../csvPipeline/CustomErrors');
const fs = require('fs').promises;
const loadCsvInput = require('../pipeline-in-progress/loadCsvInput');
const Meter = require('../../models/Meter');
const success = require('../csvPipeline/success');

async function uploadReadings(req, res, filepath, conn) {

	const { createMeter, cumulative, cumulativeReset, duplications, headerRow,
		length, meterName, mode, timeSort, update } = req.body; // extract query parameters
	//console.log(req.body);
	const areReadingsCumulative = (cumulative === 'true');
	const hasHeaderRow = (headerRow === 'true');
	const readingRepetition = duplications;
	let meter = await Meter.getByName(meterName, conn)
		.catch(err => {
			if (createMeter.toLowerCase() !== 'true') {
				throw new CSVPipelineError(`User Error: Meter with name ${meterName} is not found. createMeter was not set to true.`,
					err.message);
			}
		});
	if (!meter) {
		// this is the old meter
		//meter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, '');
		// new meters takes in default timezone, gps
		//new Meter(undefined, meter.name, meter.ipAddress, meter.enabled === 'TRUE', meter.displayable === 'TRUE', meter.type,
		//meter.meterTimezone, undefined, meter.identifier))
		meter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, undefined, undefined, undefined);
		//console.log(meter);
		await meter.insert(conn)
			.catch(err => {
				throw new CSVPipelineError('Internal OED error: Failed to insert meter into the database.', err.message);
			});
	}
	const mapRowToModel = row => { return row; }; // stub func to satisfy param
	//console.log(hasHeaderRow);
	//console.log("meter is: "+meter);
	//console.log("meter id is:" + meter.id);
	//console.log(areReadingsCumulative);
	await loadCsvInput(filepath, meter.id, mapRowToModel, false, areReadingsCumulative,
		cumulativeReset, readingRepetition, undefined, hasHeaderRow, conn); // load csv data
	// TODO: If unsuccessful upload then an error will be thrown. We need to catch this error.
	//require('../refreshReadingViews');
	fs.unlink(filepath).catch(err => log.error(`Failed to remove the file ${filepath}.`, err));
	success(req, res, 'It looks like success.'); // TODO: We need a try catch for all these awaits.
	return;
}

module.exports = uploadReadings;