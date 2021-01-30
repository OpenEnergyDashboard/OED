/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const failure = require('../services/csvPipeline/failure');
const validate = require('jsonschema').validate;

const DEFAULTS = {
	common: {
		gzip: 'true',
		headerRow: 'false',
		update: 'false'
	},
	meters: {
	},
	readings: {
		createMeter: 'false',
		cumulative: 'false',
		cumulativeReset: 'false',
		duplications: '1',
		timeSort: 'increasing'
	}
}

class Param {
	/**
	 * @param {string} paramName - The name of the parameter.
	 * @param {string} description - The description of what the parameter needs to be.
	 */
	constructor(paramName, description) {
		this.field = paramName;
		this.description = description;
		this.message = function (provided) {
			return `Provided value ${this.field}=${provided} is invalid. ${this.description}`
		}
	}
}

class EnumParam extends Param {
	/**
	 * @param {string} paramName - The name of the parameter
	 * @param {array} enums - The array of values to check against. enums.length must be greater or equal to one.
	 */
	constructor(paramName, enums) {
		super(paramName, `${paramName} can ${enums.length > 1 ? 'be one of' : 'be'} ${enums.toString()}.`);
		this.enum = enums;
	}
}
class BooleanParam extends EnumParam {
	/**
	 * @param {string} paramName - The name of the parameter.
	 */
	constructor(paramName) {
		super(paramName, ['true', 'false']);
	}
}

class StringParam extends Param {
	/**
	 * 
	 * @param {string} paramName - The name of the parameter.
	 * @param {string} pattern - Regular expression pattern to be used in validation. This can be undefined to avoid checking.
	 * @param {string} description - The description of what the parameter needs to be.
	 */
	constructor(paramName, pattern, description) {
		super(paramName, description);
		this.pattern = pattern;
		this.type = 'string';
	}
}

const COMMON_PROPERTIES = {
	gzip: new BooleanParam('gzip'),
	headerrow: new BooleanParam('headerrow'),
	password: new StringParam('password', undefined, undefined), // This is put here so it would not trigger the additionalProperties error.
	update: new BooleanParam('update')
}

const VALIDATION = {
	meters: {
		type: 'object',
		properties: {
			...COMMON_PROPERTIES
		},
		additionalProperties: false // This protects us from unintended parameters.
	},
	readings: {
		type: 'object',
		required: ['meter'],
		properties: {
			...COMMON_PROPERTIES,
			createmeter: new BooleanParam('createmeter'),
			cumulative: new BooleanParam('cumulative'),
			cumulativeReset: new BooleanParam('cumulativereset'),
			duplications: new StringParam('duplications', '^\\d+$', 'duplications must be an integer.'),
			meter: new StringParam('meter', undefined, undefined),
			timesort: new EnumParam('timesort', ['increasing'])
		},
		additionalProperties: false // This protects us from unintended parameters.
	}
}

/**
 * This validates the body of the request. If there is an error, it will throw an error with the appropriate message. 
 */
function validateRequestParams(body, schema) {
	const { errors } = validate(body, schema);
	let responseMessage = '';
	if (errors.length !== 0) {
		errors.forEach(err => {
			if (err.schema instanceof Param) {
				responseMessage = 'User Error: ' + responseMessage + err.schema.message(err.instance) + '\n';
			} else if (err.name === 'required') {
				responseMessage = 'User Error: ' + responseMessage + `${err.argument} must be provided as the field ${err.argument}=.\n`;
			} else if (err.name === 'additionalProperties') {
				responseMessage = 'User Error: ' + responseMessage + err.argument + ' is an unexpected argument.\n';
			} else {
				responseMessage = responseMessage + err.message;
			}
		});
		return {
			responseMessage: responseMessage,
			success: false
		}
	}
	return {
		responseMessage: responseMessage,
		success: true
	}
}

function validateReadingsCsvUploadParams(req, res, next) {
	const { responseMessage, success } = validateRequestParams(req.body, VALIDATION.readings);
	if (!success) {
		failure(req, res, new Error(responseMessage));
		return;
	}
	const { createmeter: createMeter, cumulative, duplications,
		gzip, headerrow: headerRow, timesort: timeSort, update } = req.body; // extract query parameters
	if (!createMeter) {
		req.body.createmeter = DEFAULTS.readings.createMeter;
	}
	if (!cumulative) {
		req.body.cumulative = DEFAULTS.readings.cumulative;
	}
	if (!duplications) {
		req.body.duplications = DEFAULTS.readings.duplications;
	}
	if (!gzip) {
		req.body.gzip = DEFAULTS.common.gzip;
	}
	if (!headerRow) {
		req.body.headerrow = DEFAULTS.common.headerRow;
	}
	if (!timeSort) {
		req.body.timesort = DEFAULTS.readings.timeSort;
	}
	if (!update) {
		req.body.update = DEFAULTS.common.update;
	}
	next();
}

function validateMetersCsvUploadParams(req, res, next) {
	const { responseMessage, success } = validateRequestParams(req.body, VALIDATION.meters);
	if (!success) {
		failure(req, res, new Error(responseMessage));
		return;
	}
	const { gzip, headerrow: headerRow, update } = req.body; // extract query parameters
	if (!gzip) {
		req.body.gzip = DEFAULTS.common.gzip;
	}
	if (!headerRow) {
		req.body.headerrow = DEFAULTS.common.headerRow;
	}
	if (!update) {
		req.body.update = DEFAULTS.common.update; // set default update param if not supplied
	}
	next();
}

module.exports = {
	validateMetersCsvUploadParams,
	validateReadingsCsvUploadParams
};