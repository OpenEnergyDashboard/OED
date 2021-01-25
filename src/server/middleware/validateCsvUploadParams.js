const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const failure = require('../services/csvPipeline/failure');

function validateCommonUploadParams(req) {
	if (!req.file) {
		throw new CSVPipelineError('No csv file uploaded.');
	}// TODO: For now we assume canonical csv structure. In the future we will have to validate csv files via headers.
	const { headerrow: headerRow } = req.body; // extract query parameters

	if (!headerRow) {
		req.body.headerrow = 'false';
	} else if (headerRow !== 'true' && headerRow !== 'false') {
		throw new CSVPipelineError(`headerrow value of ${headerRow} is not valid. Possible values are 'true' or 'false'.`);
	}
}

function validateReadingsCsvUploadParams(req, res, next) {
	try {
		validateCommonUploadParams(req); // validates common parameters for readings and meters uploads as well as set defaults
		const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications,
			length, meter: meterName, timesort: timeSort, update } = req.body; // extract query parameters
		if (!createMeter) {
			req.body.createmeter = 'false'; // set default createmeter param if not supplied
		} else if (createMeter !== 'true' && createMeter !== 'false') {
			throw new CSVPipelineError(`Create meter value ${createMeter} is not a valid value.`);
		}
		if (!cumulative) {
			req.body.cumulative = 'false'; // set default cumulative param if not supplied
		} else if (cumulative !== 'true' && cumulative !== 'false') {
			throw new CSVPipelineError(`Cumulative value ${cumulative} is not implemented.`);
		}

		if (!duplications) {
			req.body.duplications = '1'; // set default duplications param if not supplied
		} else if (Number.isInteger(Number.parseFloat(duplications))) {
			throw new CSVPipelineError(`Duplications value ${duplications} is invalid.`);
		}
		if (!meterName) {
			throw new CSVPipelineError(`Meter name must be provided as field meter.`);
		}
		if (!timeSort) {
			req.body.timesort = 'increasing'; // set default timesort param if not supplied
		} else if (timeSort !== 'increasing' && timeSort !== 'decreasing') {
			throw new CSVPipelineError(`Time sort '${timeSort}' is invalid.`);
		}
		// Fail if request to update readings.
		if (!update) {
			req.body.update = 'false'; // set default update param if not supplied
		} else if (update !== 'true' && update !== 'false') {
			throw new CSVPipelineError(`Update value for readings is not implemented for update=${update}.`);
		}
		next();
	} catch (error) {
		failure(req, res, error);
	}
}

function validateMetersCsvUploadParams(req, res, next) {
	try {
		validateCommonUploadParams(req);
		const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications,
			length, meter: meterName, timesort: timeSort, update } = req.body; // extract query parameters
		if (!update) {
			req.body.update = 'false'; // set default update param if not supplied
		} else if (update !== 'true' && update !== 'false') {
			throw new CSVPipelineError(`Update data for meters is not implemented for update=${update}.`);
		}
		next();
	} catch (error) {
		failure(req, res, error);
	}
}

module.exports = {
	validateMetersCsvUploadParams,
	validateReadingsCsvUploadParams
};