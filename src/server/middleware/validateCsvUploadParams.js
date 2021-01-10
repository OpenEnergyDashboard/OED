const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const failure = require('../services/csvPipeline/failure');

async function validateCsvUploadParams(req, res, next) {
	try {
		if (!req.file) {
			throw new CSVPipelineError('No csv file uploaded.');
		}// TODO: For now we assume canonical csv structure. In the future we will have to validate csv files via headers.
		const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter: meterName,
			mode, timesort: timeSort, update } = req.body; // extract query parameters
		switch (mode) {
			case 'readings':
				// Fail unimplemented createmeter value.
				if (createMeter && createMeter !== 'true' && createMeter !== 'false') { // default flag based on what exists on the meter
					throw new CSVPipelineError(`Create meter value ${createMeter} is not implemented.`);
				} else {
					req.body.createmeter = 'false'; // set default createmeter param if not supplied
				}
				// Fail unimplemented cumulative value.
				if (cumulative && cumulative !== 'true' && cumulative !== 'false') {
					throw new CSVPipelineError(`Cumulative value ${cumulative} is not implemented.`);
				} else {
					req.body.cumulative = 'false'; // set default cumulative param if not supplied
				} // TODO: Think about how to handle the case where the cumulative is incorrectly 'yes' when it should actually be 'no'.

				// Fail on incorrect duplication value.
				if (duplications && isNaN(duplications)) {
					throw new CSVPipelineError(`Duplications value ${duplications} is invalid.`);
				} else {
					req.body.duplications = '1'; // set default duplications param if not supplied
				}
				// Fail if no meter name provided
				if (!meterName) {
					throw new CSVPipelineError(`Meter name must be provided as field meter.`);
				}

				// Fail unimplemented time sort.
				if (timeSort && timeSort !== 'increasing' && timeSort !== 'decreasing') {
					throw new CSVPipelineError(`Time sort '${timeSort}' is invalid. Only 'increasing' is currently implemented.`);
				} else {
					req.body.timesort = 'increasing'; // set default timesort param if not supplied
				}
				// Fail if request to update readings.
				if (update && update !== 'true' && update !== 'false') {
					throw new CSVPipelineError(`Update value for readings is not implemented for update=${update}.`);
				} else {
					req.body.update = 'false'; // set default update param if not supplied
				}
				break;
			case 'meter':
				// Fail if request to update meters.
				if (update && update !== 'true' && update !== 'false') {
					throw new CSVPipelineError(`Update data for a meter is not implemented for update=${update}.`);
				} else {
					req.body.update = 'false'; // set default update param if not supplied
				}
				break;
			default:
				throw new CSVPipelineError(`Mode ${mode} is invalid. Mode can only be either 'readings' or 'meter'.`);
		}
		next();
	} catch (error) {
		failure(req, res, error);
	}
}

module.exports = validateCsvUploadParams;