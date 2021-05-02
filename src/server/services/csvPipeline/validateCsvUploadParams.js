/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
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
		cumulativeResetStart: '0:00:00',
		cumulativeResetEnd: '23:59:59',
		duplications: '1',
		length: '',
		lengthVariation: '',
		refreshReadings: 'false',
		timeSort: 'increasing'
	}
}

// These are the common upload params shared between meters and readings upload.
// Note: Even though, the 'email' and 'password' properties are not used to validate the upload, 
// they may be attached to the request body when the CSV Pipeline handles user authentication 
// (i.e. when the user performs a curl request to the pipeline). Thus, we list these properties 
// here so that they do not falsely trigger the 'additionalProperties' User Error.
const COMMON_PROPERTIES = {
	gzip: new BooleanParam('gzip'),
	headerRow: new BooleanParam('headerRow'),
	email: new StringParam('email', undefined, undefined),
	password: new StringParam('password', undefined, undefined),
	update: new BooleanParam('update')
}

// This sets the validation schemas for jsonschema.
// Validation is case sensitive. We could not find an elegant solution to perform case-insensitive validation.
const VALIDATION = {
	meters: {
		type: 'object',
		properties: {
			...COMMON_PROPERTIES
		},
		additionalProperties: false // This protects us from unintended parameters as well as typos.
	},
	readings: {
		type: 'object',
		required: ['meterName'],
		properties: {
			...COMMON_PROPERTIES,
			createMeter: new BooleanParam('createMeter'),
			cumulative: new BooleanParam('cumulative'),
			cumulativeReset: new BooleanParam('cumulativeReset'),
			cumulativeResetStart: new StringParam('cumulativeResetStart', undefined, undefined),
			cumulativeResetEnd: new StringParam('cumulativeResetEnd', undefined, undefined),
			duplications: new StringParam('duplications', '^\\d+$', 'duplications must be an integer.'),
			meterName: new StringParam('meterName', undefined, undefined),
			length: new StringParam('length', undefined, undefined),
			lengthVariation: new StringParam('lengthVariation', undefined, undefined),
			refreshReadings: new BooleanParam('refreshReadings'),
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

/**
 * Middleware that validates a request to upload readings via the CSV Pipeline and sets defaults for upload parameters.
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */
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

/**
 * Middleware that validates a request to upload meters via the CSV Pipeline and sets defaults for upload parameters.
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */
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