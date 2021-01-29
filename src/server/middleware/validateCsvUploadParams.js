const { CSVPipelineError } = require('../services/csvPipeline/CustomErrors');
const failure = require('../services/csvPipeline/failure');
const validate = require('jsonschema').validate;

const DEFAULTS = {
	common: {
		headerrow: 'false'
	},
	meters: {
		update: 'false'
	},
	readings: {
		createMeter: 'false',
		cumulative: 'false',
		cumulativeReset: 'false',
		duplications: '1',
		timeSort: 'increasing',
		update: 'false'
	}
}

class PARAM {
	/**
	 * @param {string} paramName - The name of the parameter.
	 * @param {string} description - The description of what the parameter needs to be.
	 */
	constructor(paramName, description){
		this.field = paramName;
		this.description = description;
		this.message = function(provided){
			return `Provided value ${this.field}=${provided} is invalid. ${this.description}\n`
		}
	}
}

class ENUM_PARAM extends PARAM{
	/**
	 * @param {string} paramName - The name of the parameter
	 * @param {array} enums - The array of values to check against. enums.length must be greater or equal to one.
	 */
	constructor(paramName, enums){
		super(paramName, `${paramName} can ${enums.length > 1 ? 'be one of' : 'be'} ${enums.toString()}.`);
		this.enum = enums;
	}
}
class BOOLEAN_PARAM extends ENUM_PARAM {
	/**
	 * @param {string} paramName - The name of the parameter.
	 */
	constructor(paramName){
		super(paramName, ['true', 'false']);
	}
}

class STRING_PARAM extends PARAM {
	/**
	 * 
	 * @param {string} paramName - The name of the parameter.
	 * @param {string} pattern - Regular expression pattern to be used in validation. This can be undefined to avoid checking.
	 * @param {string} description - The description of what the parameter needs to be.
	 */
	constructor(paramName, pattern, description){
		super(paramName, description);
		this.pattern = pattern;
		this.type = 'string';
	}
}

const VALIDATION = {
	meters: {
		type: 'object',
		required: [ 'password' ],
		properties: {
			password: new STRING_PARAM('password', undefined, 'A password must be provided. It must be provided as the field "password=" when uploading meters.'),
			headerrow: new BOOLEAN_PARAM('headerrow'),
			update: new BOOLEAN_PARAM('update')
		},
		additionalProperties: false // This protects us from unintended parameters.
	},
	readings: {
		type: 'object',
		required: [ 'meter', 'password' ],
		properties: {
			createmeter: new BOOLEAN_PARAM('createmeter'),
			cumulative: new BOOLEAN_PARAM('cumulative'),
			cumulativeReset: new BOOLEAN_PARAM('cumulativereset'),
			duplications: new STRING_PARAM('duplications', '^\\d+$', 'duplications must be an integer.'),
			headerrow: new BOOLEAN_PARAM('headerrow'),
			meter: new STRING_PARAM('meter', undefined, 'A meter name must be provided. It must be provided as the field "meter=" when uploading readings.'),
			timesort: new ENUM_PARAM('timesort', ['increasing']),
			password: new STRING_PARAM('password', undefined, 'A password must be provided. It must be provided as the field "password=" when uploading readings.'),
			update: new BOOLEAN_PARAM('update')
		},
		additionalProperties: false // This protects us from unintended parameters.
	}
}

function validateCommonUploadParams(req) {
	if (!req.file) {
		throw new CSVPipelineError('No csv file uploaded.');
	}// TODO: For now we assume canonical csv structure. In the future we will have to validate csv files via headers.
	const { headerrow: headerRow } = req.body; // extract query parameters

	if (!headerRow) {
		req.body.headerrow = DEFAULTS.common.headerrow;
	} else if (headerRow !== 'true' && headerRow !== 'false') {
		throw new CSVPipelineError(`headerrow value of ${headerRow} is not valid. Possible values are 'true' or 'false'.`);
	}
}

function validateReadingsCsvUploadParams(req, res, next) {
	try {
		validateCommonUploadParams(req); // validates common parameters for readings and meters uploads as well as set defaults
		const valid = validate(req.body, VALIDATION.readings);
		if(valid.errors.length !== 0){
			let responseMessage = '';
			valid.errors.forEach(err => {
				if(err.schema instanceof PARAM){
					responseMessage = responseMessage + err.schema.message(err.instance);
				} else {
					responseMessage = responseMessage + err.message;
				}
			});
			throw new CSVPipelineError(responseMessage);
		}
		const { createmeter: createMeter, cumulative, cumulativereset: cumulativeReset, duplications,
			length, timesort: timeSort, update } = req.body; // extract query parameters
		if (!createMeter) {
			req.body.createmeter = DEFAULTS.readings.createMeter;
		} 
		if (!cumulative) {
			req.body.cumulative = DEFAULTS.readings.cumulative;
		}
		if (!duplications) {
			req.body.duplications = DEFAULTS.readings.duplications;
		}
		if (!timeSort) {
			req.body.timesort = DEFAULTS.readings.timeSort;
		} 
		if (!update) {
			req.body.update = DEFAULTS.readings.update;
		} 
		next();
	} catch (error) {
		failure(req, res, error);
	}
}

function validateMetersCsvUploadParams(req, res, next) {
	try {
		validateCommonUploadParams(req);
		const valid = validate(req.body, VALIDATION.meters);
		if(valid.errors.length !== 0){
			let responseMessage = '';
			valid.errors.forEach(err => {
				if(err.schema.description){
					responseMessage = responseMessage + err.schema.description + '\n';
				} else {
					responseMessage = responseMessage + err.message;
				}
			});
			throw new CSVPipelineError(responseMessage);
		}
		const { update } = req.body; // extract query parameters
		if (!update) {
			req.body.update = DEFAULTS.meters.update; // set default update param if not supplied
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