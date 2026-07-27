/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Meter = require('../models/Meter');
const User = require('../models/User');
const Unit = require('../models/Unit');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const { isTokenAuthorized } = require('../util/userRoles');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const Point = require('../models/Point');
const moment = require('moment');
const { MeterTimeSortTypesJS } = require('../services/csvPipeline/validateCsvUploadParams');
const merge = require('lodash/merge');
const { failure, success, LogLevel } = require('./response');
const { updateNonNullExpression } = require('typescript');
const { STRING_GENERAL_MAX_LENGTH, STRING_SHORT_MAX_LENGTH: SHORT_STRING_MAX_LENGTH, NUMERIC_ID_MAX_LENGTH } = require('../util/validationConstants');
const { HTTP_CODES } = require('../util/httpCodes');
const { isValidIsoDateTime } = require('../util/timeValidation');

const router = express.Router();

/**
 * Defines the format in which we want to send meters and controls what information we send to the client, if logged in and an Admin or not.
 * @param meter
 * @param hasFullAccess
 * @returns {{id, name}}
 */
function formatMeterForResponse(meter, hasFullAccess) {
	const formattedMeter = {
		id: meter.id,
		name: null,
		url: null,
		enabled: meter.enabled,
		displayable: meter.displayable,
		meterType: null,
		timeZone: null,
		gps: meter.gps,
		identifier: (meter.displayable === true) ? meter.identifier : null,
		note: null,
		area: meter.area,
		cumulative: null,
		cumulativeReset: null,
		cumulativeResetStart: null,
		cumulativeResetEnd: null,
		readingGap: null,
		readingVariation: null,
		readingDuplication: null,
		timeSort: null,
		endOnlyTime: null,
		reading: null,
		startTimestamp: null,
		endTimestamp: null,
		previousEnd: null,
		unitId: meter.unitId,
		defaultGraphicUnit: meter.defaultGraphicUnit,
		areaUnit: meter.areaUnit,
		readingFrequency: null,
		minVal: null,
		maxVal: null,
		minDate: null,
		maxDate: null,
		maxError: null,
		disableChecks: null,
	};

	// Only logged in Admins can see url, types, timezones, and internal names
	// and lots of other items now.
	if (hasFullAccess) {
		formattedMeter.name = meter.name;
		formattedMeter.url = meter.url;
		formattedMeter.meterType = meter.type;
		formattedMeter.timeZone = meter.meterTimezone;
		formattedMeter.identifier = meter.identifier;
		formattedMeter.note = meter.note;
		formattedMeter.cumulative = meter.cumulative;
		formattedMeter.cumulativeReset = meter.cumulativeReset;
		formattedMeter.cumulativeResetStart = meter.cumulativeResetStart;
		formattedMeter.cumulativeResetEnd = meter.cumulativeResetEnd;
		formattedMeter.readingGap = meter.readingGap;
		formattedMeter.readingVariation = meter.readingVariation;
		formattedMeter.readingDuplication = meter.readingDuplication;
		formattedMeter.timeSort = meter.timeSort;
		formattedMeter.endOnlyTime = meter.endOnlyTime;
		formattedMeter.reading = meter.reading;
		formattedMeter.startTimestamp = meter.startTimestamp;
		formattedMeter.endTimestamp = meter.endTimestamp;
		formattedMeter.previousEnd = meter.previousEnd;
		formattedMeter.readingFrequency = meter.readingFrequency;
		formattedMeter.minVal = meter.minVal;
		formattedMeter.maxVal = meter.maxVal;
		formattedMeter.minDate = meter.minDate;
		formattedMeter.maxDate = meter.maxDate;
		formattedMeter.maxError = meter.maxError;
		formattedMeter.disableChecks = meter.disableChecks;
	}

	return formattedMeter;
}

/**
 * GET information on displayable meters (or all meters, if logged in as an admin.)
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
	try {
		const conn = getConnection();
		let query;
		const token = req.headers.token || req.body.token || req.query.token;
		const isAuthorizedCSV = req.hasValidAuthToken && (await isTokenAuthorized(token, User.role.CSV));
		// Because groups can use hidden meters, everyone gets all meters but we filter the
		// information given about the meter after getting it.
		query = Meter.getAll;

		const rows = await query(conn);
		res.json(rows.map(row => formatMeterForResponse(row, isAuthorizedCSV)));
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET all meters query: ${err.message}`, { cause: err }));
	}
});

/**
 * GET information for a specific meter by id
 * Prohibits access to meters that are not displayable if not logged in
 * @param {int} meter_id
 */
router.get('/:meter_id', optionalAuthMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		required: ['meter_id'],
		properties: {
			meter_id: {
				type: 'string',
				pattern: '^\\d+$',
				maxLength: NUMERIC_ID_MAX_LENGTH
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		// No message given so as not to reveal whether the meter exists, matching the branch below.
		failure(res, HTTP_CODES.BAD_REQUEST);
	} else {
		const conn = getConnection();
		try {
			const meter = await Meter.getByID(req.params.meter_id, conn);
			if (meter.displayable || req.hasValidAuthToken) {
				// If the meter is displayable, fine. If the meter is
				// not displayable but the user is logged in, also fine.
				res.json(formatMeterForResponse(meter, req.hasValidAuthToken));
			} else {
				// No message given so as not to reveal that the meter exists but is non-displayable.
				failure(res, HTTP_CODES.BAD_REQUEST);
			}
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET specific meter by id query: ${err.message}`, { cause: err }));
		}
	}
});

// This checks params for both edit and create. The id property is only validated on edit since the DB assigns it on create.
function validateMeterParams(params, isEdit = true) {
	const properties = {
			name: { type: 'string', maxLength: SHORT_STRING_MAX_LENGTH },
			url: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			enabled: { type: 'boolean' },
			displayable: { type: 'boolean' },
			meterType: {
				type: 'string',
				enum: Object.values(Meter.type),
				maxLength: SHORT_STRING_MAX_LENGTH
			},
			timeZone: {
				oneOf: [
					{ type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
					{ type: 'null' }
				]
			},
			gps: {
				oneOf: [
					{
						type: 'object',
						required: ['latitude', 'longitude'],
						properties: {
							latitude: { type: 'number', minimum: '-90', maximum: '90' },
							longitude: { type: 'number', minimum: '-180', maximum: '180' }
						}
					},
					{ type: 'null' }
				]
			},
			identifier: {
				oneOf: [
					{ type: 'string', maxLength: SHORT_STRING_MAX_LENGTH },
					{ type: 'null' }
				]
			},
			note: {
				oneOf: [
					{ type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
					{ type: 'null' }
				]
			},
			area: { type: 'number', minimum: 0 },
			cumulative: { type: 'boolean' },
			cumulativeReset: { type: 'boolean' },
			// Time-of-day strings (HH:MM:SS); do not use moment so only length-limited here.
			cumulativeResetStart: { type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
			cumulativeResetEnd: { type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
			readingGap: { type: 'number' },
			readingVariation: { type: 'number' },
			readingDuplication: { type: 'integer', minimum: '1', maximum: '9' },
			timeSort: {
				type: 'string',
				enum: Object.values(MeterTimeSortTypesJS),
				maxLength: SHORT_STRING_MAX_LENGTH
			},
			endOnlyTime: { type: 'boolean' },
			reading: { type: 'number' },
			startTimestamp: { type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
			endTimestamp: { type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
			previousEnd: {
				oneOf: [
					{ type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
					{ type: 'null' }
				]
			},
			unitId: { type: 'integer' },
			defaultGraphicUnit: {'anyOf': [{ type: 'integer', minimum: 1 }, { type: 'integer', 'enum': [-99] }]},
			areaUnit: {
				type: 'string',
				minLength: 1,
				maxLength: 50,
				enum: Object.values(Unit.areaUnitType)
			},
			// PostgreSQL interval string (e.g. "00:15:00"); does not use moment so only length-limited here.
			readingFrequency: { type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
			minVal: { type: 'number' },
			maxVal: { type: 'number' },
			minDate: { type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
			maxDate: { type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
			maxError: { type: 'integer' },
			disableChecks: {
				type: 'string',
				minLength: 1,
				maxLength: 50,
				enum: Object.values(Unit.disableChecksType)
			}
	};

	if (isEdit) {
		properties.id = { type: 'integer', minimum: 1 };
	}

	// We can get rid of some of these if we defaulted more values in the meter model.
	const required = ['name', 'url', 'enabled', 'displayable', 'meterType', 'timeZone', 'note', 'area'];

	if (isEdit) {
		required.push('id');
	}

	const validParams = {
		type: 'object',
		additionalProperties: false,
		required,
		properties
	};
	const paramsValidationResult = validate(params, validParams);
	return { valid: paramsValidationResult.valid, errors: paramsValidationResult.errors };
}

router.post('/edit', adminAuthMiddleware('edit meters'), async (req, res) => {
	// isEdit=true: id is required here since the client must tell us which meter to update.
	const response = validateMeterParams(req.body, true)
	if (!response.valid) {
		const message = 'validation failed with ' + response.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message, LogLevel.WARN);
	} else if (
		(req.body.startTimestamp && !isValidIsoDateTime(req.body.startTimestamp, false)) ||
		(req.body.endTimestamp && !isValidIsoDateTime(req.body.endTimestamp, false)) ||
		(req.body.previousEnd && !isValidIsoDateTime(req.body.previousEnd)) ||
		(req.body.minDate && !isValidIsoDateTime(req.body.minDate)) ||
		(req.body.maxDate && !isValidIsoDateTime(req.body.maxDate))
	) {
		failure(res, HTTP_CODES.BAD_REQUEST, null, 'invalid date/time format');
	} else {
		const conn = getConnection();
		try {
			const meter = await Meter.getByID(req.body.id, conn);
			const updatedMeter = new Meter(
				undefined, // id
				req.body.name,
				req.body.url,
				req.body.enabled,
				req.body.displayable,
				req.body.meterType,
				req.body.timeZone,
				(req.body.gps) ? new Point(req.body.gps.longitude, req.body.gps.latitude) : null,
				req.body.identifier,
				req.body.note,
				req.body.area,
				req.body.cumulative,
				req.body.cumulativeReset,
				(req.body.cumulativeResetStart.length) === 0 ? undefined : req.body.cumulativeResetStart,
				(req.body.cumulativeResetEnd.length) === 0 ? undefined : req.body.cumulativeResetEnd,
				req.body.readingGap,
				req.body.readingVariation,
				req.body.readingDuplication,
				req.body.timeSort,
				req.body.endOnlyTime,
				req.body.reading,
				(req.body.startTimestamp.length === 0) ? undefined : req.body.startTimestamp,
				(req.body.endTimestamp.length === 0) ? undefined : req.body.endTimestamp,
				(req.body.previousEnd === null || req.body.previousEnd.length === 0) ? undefined : moment(req.body.previousEnd),
				req.body.unitId,
				req.body.defaultGraphicUnit,
				req.body.areaUnit,
				req.body.readingFrequency,
				req.body.minVal,
				req.body.maxVal,
				moment(req.body.minDate),
				moment(req.body.maxDate),
				req.body.maxError,
				req.body.disableChecks
			);
			// Put any changed values from updatedMeter into meter.
			merge(meter, updatedMeter);
			// The frequency may be different since DB stores as interval so it is returned
			// and the meter updated by this value.
			meter.readingFrequency = await meter.update(conn);
			// Need to format since some properties have different names than come from DB.
			success(res, formatMeterForResponse(meter, true));
		} catch (err) {
			const detail = err['detail'] ? ` with detail "${err['detail']}"` : '';
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while editing a meter${detail}: ${err.message}`, { cause: err }));
		}
	}
});

/**
 * Route for POST add meter.
 */
router.post('/addMeter', adminAuthMiddleware('add meter'), async (req, res) => {
	// isEdit=false: id must not be present, since it's assigned by the DB on insert.
	const response = validateMeterParams(req.body, false)
	if (!response.valid) {
		const message = 'validation failed with ' + response.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message, LogLevel.WARN);
	} else if (
		// The default value for start/endTimestamp does have a timezone but it is not required nor put
		// in when OED sets the value later so not checked here.
		(req.body.startTimestamp && !isValidIsoDateTime(req.body.startTimestamp, false)) ||
		(req.body.endTimestamp && !isValidIsoDateTime(req.body.endTimestamp, false)) ||
		(req.body.previousEnd && !isValidIsoDateTime(req.body.previousEnd)) ||
		(req.body.minDate && !isValidIsoDateTime(req.body.minDate)) ||
		(req.body.maxDate && !isValidIsoDateTime(req.body.maxDate))
	) {
		failure(res, HTTP_CODES.BAD_REQUEST, null, 'invalid date/time format');
	} else {
		const conn = getConnection();
		try {
			const newMeter = new Meter(
				undefined, //id
				req.body.name,
				req.body.url,
				req.body.enabled,
				req.body.displayable,
				req.body.meterType,
				req.body.timeZone,
				(req.body.gps) ? new Point(req.body.gps.longitude, req.body.gps.latitude) : null,
				req.body.identifier,
				req.body.note,
				req.body.area,
				req.body.cumulative,
				req.body.cumulativeReset,
				(req.body.cumulativeResetStart.length === 0) ? undefined : req.body.cumulativeResetStart,
				(req.body.cumulativeResetEnd.length) === 0 ? undefined : req.body.cumulativeResetEnd,
				req.body.readingGap,
				req.body.readingVariation,
				req.body.readingDuplication,
				req.body.timeSort,
				req.body.endOnlyTime,
				req.body.reading,
				(req.body.startTimestamp.length === 0) ? undefined : req.body.startTimestamp,
				(req.body.endTimestamp.length === 0) ? undefined : req.body.endTimestamp,
				(req.body.previousEnd.length === 0) ? undefined : moment(req.body.previousEnd),
				req.body.unitId,
				req.body.defaultGraphicUnit,
				req.body.areaUnit,
				req.body.readingFrequency,
				req.body.minVal,
				req.body.maxVal,
				moment(req.body.minDate),
				moment(req.body.maxDate),
				req.body.maxError,
				req.body.disableChecks
			);
			// insert updates the newMeter values from DB.
			await newMeter.insert(conn);
			// Need to format since some properties have different names than come from DB.
			success(res, formatMeterForResponse(newMeter, true));
		} catch (err) {
			const detail = err['detail'] ? ` with detail "${err['detail']}"` : '';
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while inserting new meter${detail}: ${err.message}`, { cause: err }));
		}
	}
});

module.exports = router;
