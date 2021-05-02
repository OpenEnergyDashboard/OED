/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { CSVPipelineError } = require('./CustomErrors');
const { Param, EnumParam, BooleanParam, StringParam } = require('./ValidationSchemas');
const failure = require('./failure');
const validate = require('jsonschema').validate;

// These are the default values of CSV Pipeline upload parameters.
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

const COMMON_PROPERTIES = {
	gzip: new BooleanParam('gzip'),
	headerRow: new BooleanParam('headerRow'),
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
		required: ['meterName'],
		properties: {
			...COMMON_PROPERTIES,
			createMeter: new BooleanParam('createMeter'),
			cumulative: new BooleanParam('cumulative'),
			cumulativeReset: new BooleanParam('cumulativeReset'),
			duplications: new StringParam('duplications', '^\\d+$', 'duplications must be an integer.'),
			meterName: new StringParam('meterName', undefined, undefined),
			timeSort: new EnumParam('timeSort', ['increasing'])
		},
		additionalProperties: false // This protects us from unintended parameters as well as typos.
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
	// Validate the parameters of the request. Failure out if there are any unintended mistakes such as additional parameters and typos.
	const { responseMessage, success } = validateRequestParams(req.body, VALIDATION.readings);
	if (!success) {
		failure(req, res, new CSVPipelineError(responseMessage));
		return;
	}

	const { createMeter, cumulative, duplications,
		gzip, headerRow, timeSort, update } = req.body; // extract query parameters

	// Set default values of not supplied parameters.
	if (!createMeter) {
		req.body.createMeter = DEFAULTS.readings.createMeter;
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
		req.body.headerRow = DEFAULTS.common.headerRow;
	}
	if (!timeSort) {
		req.body.timeSort = DEFAULTS.readings.timeSort;
	}
	if (!update) {
		req.body.update = DEFAULTS.common.update;
	}
	next();
}

function validateMetersCsvUploadParams(req, res, next) {
	// Validate the parameters of the request. Failure out if there are any unintended mistakes such as additional parameters and typos.
	const { responseMessage, success } = validateRequestParams(req.body, VALIDATION.meters);
	if (!success) {
		failure(req, res, new CSVPipelineError(responseMessage));
		return;
	}

	const { gzip, headerRow, update } = req.body; // Extract query parameters

	// Set default values of not supplied parameters.
	if (!gzip) {
		req.body.gzip = DEFAULTS.common.gzip;
	}
	if (!headerRow) {
		req.body.headerRow = DEFAULTS.common.headerRow;
	}
	if (!update) {
		req.body.update = DEFAULTS.common.update;
	}
	next();
}

module.exports = {
	validateMetersCsvUploadParams,
	validateReadingsCsvUploadParams
};