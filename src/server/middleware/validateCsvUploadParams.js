const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const { failure } = require('../routes/csv');

async function validateCsvUploadParams(req, res, next) {
	try {
		if (!req.file) {
			throw CSVPipelineError('No csv file uploaded.');
		}// TODO: For now we assume canonical csv structure. In the future we will have to validate csv files via headers.
		const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications, length, meter: meterName,
			mode, timesort: timeSort, update } = req.body; // extract query parameters
		switch (mode) {
			case 'readings':
				// Fail unimplemented createmeter value.
				if (createMeter && createMeter !== 'true') { // default flag based on what exists on the meter
					throw CSVPipelineError(`Create meter value ${createMeter} is not implemented.`);
				}
				// Fail unimplemented cumulative value.
				if (cumulative && cumulative !== 'true' && cumulative !== 'false') {
					throw CSVPipelineError(req, res, `Cumulative value ${cumulative} is not implemented.`);
				} // TODO: Think about how to handle the case where the cumulative is incorrectly 'yes' when it should actually be 'no'.
				const areReadingsCumulative = (cumulative === 'yes');
				// Fail on incorrect duplication value.
				if (duplications && isNaN(duplications)) {
					throw CSVPipelineError(`Duplications value ${duplications} is invalid.`);
				}
				// Fail if no meter name provided
				if (!meterName) {
					throw CSVPipelineError(`Meter name must be provided as field meter.`);
				}
				// Fail unimplemented time sort.
				if (timeSort && timeSort !== 'increasing') {
					throw CSVPipelineError(`Time sort '${timeSort}' is invalid. Only 'increasing' is currently implemented.`);
				}
				// Fail if request to update readings.
				if (update && update !== 'false') {
					throw CSVPipelineError(`Update value for readings is not implemented for update=${update}.`);
                }
                break;
			case 'meter':
				throw CSVPipelineError('Temporarily disabled.');
				// return;
			default:
				throw CSVPipelineError(`Mode ${mode} is invalid. Mode can only be either 'readings' or 'meter'.`);
		}
		next();
	} catch (error) {
		failure(req, res, error);
	}
}

module.exports = validateCsvUploadParams;