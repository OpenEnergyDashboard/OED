/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { CSVPipelineError } = require('./CustomErrors');
const { Param, EnumParam, BooleanParam, StringParam } = require('./ValidationSchemas');
const failure = require('./failure');
const validate = require('jsonschema').validate;

// This is only used for meter page inputs but put here so next one above that related to.
/**
 * Enum of CSV input type sorting.
 * This enum needs to be kept in sync with the enum in src/client/app/types/csvUploadForm.ts 
 * @enum {string}
 */
MeterTimeSortTypesJS = Object.freeze({
	increasing: 'increasing',
	decreasing: 'decreasing',
});

// This function allows for curl users to continue to use 'yes' or 'no' and also allows string
// values of true or false if the change is made.
const normalizeBoolean = (input) => {
	if (typeof input === 'string') {
		input = input.toLowerCase();
	}

	switch (input) {
		case 'yes':
		case 'true':
		case true:
			return true;
		case 'no':
		case 'false':
		case false:
			return false;
		default:
			return 'normalizeBoolean error'; // Return the original value if it does not match any of the boolean representations
	}
};

// This is to allow curl users to still send 'yes' and 'no' for parameters sent,
// The frontend will just use standard boolean values to send to the API
const BooleanCheckArray = ['yes', 'no', 'true', 'false', true, false];

// These are the default values of CSV Pipeline upload parameters. If a user does not specify
// a choice for a particular parameter, then these defaults will be used.
// Some defaults are listed as `undefined`; this is only relevant for cURL requests. It means that the default will be acquired from some external 
// source at runtime. For example, the defaults for cumulative and cumulativeReset are `undefined` because the pipeline will read them from the 
// database if they were not specified by the user. To override this default, the user would supply the appropriate value. 
// Even though, we could simply leave out such fields from DEFAULTS and achieve the same effect
// as listing them as `undefined`, we should still list them here to indicate that such fields have an "external runtime default".
// All of this is less relevant when using the webapp, because (TODO) it would load these external runtime defaults for the user.
// TODO: 
// We use strings to represent the true/false values of an option. The pipeline should really not be doing checks against raw strings, 
// we should change these strings to booleans.
const DEFAULTS = {
	common: {
		gzip: true,
		headerRow: false,
		update: false
	},
	meters: {
	},
	readings: {
		cumulative: undefined,
		cumulativeReset: undefined,
		cumulativeResetStart: undefined,
		cumulativeResetEnd: undefined,
		duplications: undefined,
		endOnly: undefined,
		honorDst: false,
		lengthGap: undefined,
		lengthVariation: undefined,
		refreshReadings: false,
		relaxedParsing: false,
		timeSort: undefined,
		useMeterZone: false
	}
}

// These are the common upload params shared between meters and readings upload.
// Note: Even though, the 'username' and 'password' properties are not used to validate the upload, 
// they may be attached to the request body when the CSV Pipeline handles user authentication 
// (i.e. when the user performs a curl request to the pipeline). Thus, we list these properties 
// here so that they do not falsely trigger the 'additionalProperties' User Error.
const COMMON_PROPERTIES = {
	meterIdentifier: new StringParam('meterIdentifier', undefined, undefined),
	username: new StringParam('username', undefined, undefined),
	// TODO:
	// Allowing for backwards compatibility to allow for curl users to use the 'email' parameter instead of
	// the 'username' parameter to login. Also allowing to use 'meterName' vs 'meterIdentifier'. Developers need
	// to decide in the future if we should deprecate email & meterName or continue to allow this backwards compatibility.
	meterName: new StringParam('meterName', undefined, undefined),
	email: new StringParam('email', undefined, undefined),
	password: new StringParam('password', undefined, undefined),
	gzip: new EnumParam('gzip', BooleanCheckArray),
	headerRow: new EnumParam('headerRow', BooleanCheckArray),
	update: new EnumParam('update', BooleanCheckArray)
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
		properties: {
			...COMMON_PROPERTIES,
			cumulative: new EnumParam('cumulative', BooleanCheckArray),
			cumulativeReset: new EnumParam('cumulativeReset', BooleanCheckArray),
			cumulativeResetStart: new StringParam('cumulativeResetStart', undefined, undefined),
			cumulativeResetEnd: new StringParam('cumulativeResetEnd', undefined, undefined),
			duplications: new StringParam('duplications', '^\\d+$|^(?![\s\S])', 'duplications must be an integer or empty.'),
			endOnly: new EnumParam('endOnly', BooleanCheckArray),
			honorDst: new EnumParam('honorDst', BooleanCheckArray),
			lengthGap: new StringParam('lengthGap', undefined, undefined),
			lengthVariation: new StringParam('lengthVariation', undefined, undefined),
			refreshReadings: new EnumParam('refreshReadings', BooleanCheckArray),
			relaxedParsing: new EnumParam('relaxedParsing', BooleanCheckArray),
			timeSort: new EnumParam('timeSort', [MeterTimeSortTypesJS.increasing, MeterTimeSortTypesJS.decreasing]),
			useMeterZone: new EnumParam('useMeterZone', BooleanCheckArray),
		},
		anyOf: [
			{ required: ['meterIdentifier'] },
			{ required: ['meterName'] }
		],
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
				responseMessage = 'User Error: ' + responseMessage + err.path + ': ' + err.schema.message(err.instance) + '\n';
			} else if (err.name === 'required') {
				responseMessage = 'User Error: ' + responseMessage + err.path + ': ' + `${err.argument} must be provided as the field ${err.argument}=.\n`;
			} else if (err.name === 'additionalProperties') {
				responseMessage = 'User Error: ' + responseMessage + err.path + ': ' + err.argument + ' is an unexpected argument.\n';
			} else {
				responseMessage = responseMessage + err.path + ': ' + 'has message: ' + err.message;
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
	
	const { cumulative, cumulativeReset, duplications, gzip, headerRow, timeSort, update, honorDst,
		relaxedParsing, useMeterZone } = req.body; // extract query parameters

	// Set default values of not supplied parameters.
	if (cumulative === undefined) {
		req.body.cumulative = DEFAULTS.readings.cumulative;
	}
	if (cumulativeReset === undefined) {
		req.body.cumulativeReset = DEFAULTS.readings.cumulativeReset;
	}
	if (duplications === undefined) {
		req.body.duplications = DEFAULTS.readings.duplications;
	}
	if (gzip === undefined) {
		req.body.gzip = DEFAULTS.common.gzip;
	}
	if (headerRow === undefined) {
		req.body.headerRow = DEFAULTS.common.headerRow;
	}
	if (timeSort === undefined) {
		req.body.timeSort = DEFAULTS.readings.timeSort;
	}
	if (update === undefined) {
		req.body.update = DEFAULTS.common.update;
	}
	if (honorDst === undefined) {
		req.body.honorDst = DEFAULTS.readings.honorDst;
	}
	if (relaxedParsing === undefined) {
		req.body.relaxedParsing = DEFAULTS.readings.relaxedParsing;
	}
	if (useMeterZone === undefined) {
		req.body.useMeterZone = DEFAULTS.readings.useMeterZone;
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
	if (gzip === undefined) {
		req.body.gzip = DEFAULTS.common.gzip;
	}
	if (headerRow === undefined) {
		req.body.headerRow = DEFAULTS.common.headerRow;
	}
	if (update === undefined) {
		req.body.update = DEFAULTS.common.update;
	}
	next();
}

module.exports = {
	validateMetersCsvUploadParams,
	validateReadingsCsvUploadParams,
	MeterTimeSortTypesJS,
	normalizeBoolean
};
