const { CSVPipelineError } = require('../csvPipeline/CustomErrors');
const fs = require('fs').promises;
const loadCsvInput = require('../pipeline-in-progress/loadCsvInput');
const Meter = require('../../models/Meter');
const success = require('../csvPipeline/success');

async function uploadReadings(req, res, filepath, conn) {

	const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter: meterName,
		mode, timesort: timeSort, update } = req.body; // extract query parameters

	const areReadingsCumulative = (cumulative === 'true');
	const readingRepetition = duplications;

	let meter = await Meter.getByName(meterName, conn)
		.catch(err => {
			if (createMeter !== 'true') {
				throw new CSVPipelineError(`Internal OED error: Meter with name ${meterName} is not found. createMeter was not set to true.`, err.message);
			}
		});
	if (!meter) {
		meter = new Meter(undefined, meterName, undefined, false, false, Meter.type.MAMAC, meterName);
		await meter.insert(conn)
			.catch(err => {
				throw new CSVPipelineError('Internal OED error: Failed to insert meter into the database.', err.message);
			});
	}
	const mapRowToModel = (row) => { return row; }; // stub func to satisfy param
	await loadCsvInput(filepath, meter.id, mapRowToModel, false, areReadingsCumulative, cumulativeReset, readingRepetition, undefined, conn); // load csv data
	// TODO: If unsuccessful upload then an error will be thrown. We need to catch this error.
	fs.unlink(filepath).catch(err => log.error(`Failed to remove the file ${filepath}.`, err)); // TODO: do we really need this to complete before sending back a response and should this file be removed on an unsuccessful upload?
	success(req, res, `It looks like success.`); // TODO: We need a try catch for all these awaits.
	return;
}

module.exports = uploadReadings;