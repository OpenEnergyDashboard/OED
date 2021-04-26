/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { CSVPipelineError } = require('./CustomErrors');
const success = require('./success');
const fs = require('fs').promises;
const loadCsvInput = require('../pipeline-in-progress/loadCsvInput');
const Meter = require('../../models/Meter');

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
				throw new CSVPipelineError(
					`User Error: Meter with name '${meterName}' not found. createMeter needs to be set true in order to automatically create meter.`,
					err.message
				);
			}
		});
	if (!meter) {
		meter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, undefined, undefined, undefined);
		await meter.insert(conn)
			.catch(err => {
				throw new CSVPipelineError('Internal OED error: Failed to insert meter into the database.', err.message, 500);
			});
	}
	const mapRowToModel = row => { return row; }; // stub func to satisfy param
	await loadCsvInput(
		filepath,
		meter.id,
		mapRowToModel,
		false,
		areReadingsCumulative,
		cumulativeReset,
		readingRepetition,
		undefined,
		hasHeaderRow,
		conn
	); // load csv data
	// TODO: If unsuccessful upload then an error will be thrown. We need to catch this error.
	require ('../refreshReadingViews');
	fs.unlink(filepath).catch(err => log.error(`Failed to remove the file ${filepath}.`, err));
	success(req, res, 'It looks like success.'); // TODO: We need a try catch for all these awaits.
	return;
}

module.exports = uploadReadings;