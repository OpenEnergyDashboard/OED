/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Meter = require('../models/Meter');
const User = require('../models/User');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const { isTokenAuthorized } = require('../util/userRoles');
const requiredAdmin = require('./authenticator').adminAuthMiddleware;
const optionalAuthenticator = require('./authenticator').optionalAuthMiddleware;
const Point = require('../models/Point');
const moment = require('moment');
const { MeterTimeSortTypesJS } = require('../services/csvPipeline/validateCsvUploadParams');
const _ = require('lodash');
const { failure, success } = require('./response');

const router = express.Router();
router.use(optionalAuthenticator);

/**
 * Defines the format in which we want to send meters and controls what information we send to the client, if logged in and an Admin or not.
 * @param meter
 * @param loggedInAsAdmin
 * @returns {{id, name}}
 */
function formatMeterForResponse(meter, loggedInAsAdmin) {
	const formattedMeter = {
		id: meter.id,
		name: null,
		enabled: meter.enabled,
		displayable: meter.displayable,
		url: null,
		meterType: null,
		timeZone: null,
		gps: meter.gps,
		identifier: meter.identifier,
		area: meter.area,
		note: null,
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
		defaultGraphicUnit: meter.defaultGraphicUnit
	};

	// Only logged in Admins can see url, types, timezones, and internal names
	// and lots of other items now.
	if (loggedInAsAdmin) {
		formattedMeter.url = meter.url;
		formattedMeter.meterType = meter.type;
		formattedMeter.timeZone = meter.meterTimezone;
		formattedMeter.name = meter.name;
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
	}

	// TODO: remove this line when usages of meter.name are replaced with meter.identifier
	// Without this, things will break for non-logged in users because we currently rely on
	// the internal name being available. As noted in #605, the intent is to not send the
	// name to a user if they are not logged in.
	formattedMeter.name = meter.name;

	return formattedMeter;
}

/**
 * GET information on displayable meters (or all meters, if logged in as an admin.)
 */
router.get('/', async (req, res) => {
	try {
		const conn = getConnection();
		let query;
		const token = req.headers.token || req.body.token || req.query.token;
		const loggedInAsAdmin = req.hasValidAuthToken && (await isTokenAuthorized(token, User.role.ADMIN));
		if (loggedInAsAdmin) {
			query = Meter.getAll;
		} else {
			query = Meter.getDisplayable;
		}

		const rows = await query(conn);
		res.json(rows.map(row => formatMeterForResponse(row, loggedInAsAdmin)));
	} catch (err) {
		log.error(`Error while performing GET all meters query: ${err}`, err);
	}
});

/**
 * GET information for a specific meter by id
 * Prohibits access to meters that are not displayable if not logged in
 * @param {int} meter_id
 */
router.get('/:meter_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_id'],
		properties: {
			meter_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			const meter = await Meter.getByID(req.params.meter_id, conn);
			if (meter.displayable || req.hasValidAuthToken) {
				// If the meter is displayable, fine. If the meter is
				// not displayable but the user is logged in, also fine.
				res.json(formatMeterForResponse(meter, req.hasValidAuthToken));
			} else {
				res.sendStatus(400);
			}
		} catch (err) {
			log.error(`Error while performing GET specific meter by id query: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

// This checks params for both edit and create. In principle they could differ since not all needed for create
// but they are the same due to current routing for now.
function validateMeterParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 26,
		// We can get rid of some of these if we defaulted more values in the meter model.
		required: ['name', 'url', 'enabled', 'displayable', 'meterType', 'timeZone', 'note', 'area'],
		properties: {
			id: { type: 'integer' },
			name: { type: 'string' },
			url: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			enabled: { type: 'bool' },
			displayable: { type: 'bool' },
			meterType: {
				type: 'string',
				enum: Object.values(Meter.type)
			},
			timeZone: {
				oneOf: [
					{ type: 'string' },
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
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			area: {
				oneOf: [
					{
						type: 'number',
						minimum: 0,
					},
					{ type: 'null' }
				]
			},
			cumulative: { type: 'bool' },
			cumulativeReset: { type: 'bool' },
			cumulativeResetStart: { type: 'string' },
			cumulativeResetEnd: { type: 'string' },
			readingGap: { type: 'number' },
			readingVariation: { type: 'number' },
			readingDuplication: { type: 'integer', minimum: '1', maximum: '9' },
			timeSort: {
				type: 'string',
				enum: Object.values(MeterTimeSortTypesJS)
			},
			endOnlyTime: { type: 'bool' },
			reading: { type: 'number' },
			startTimestamp: { type: 'string' },
			endTimestamp: { type: 'string' },
			previousEnd: { type: 'string' },
			unitId: { type: 'integer' },
			defaultGraphicUnit: { type: 'integer' }
		}
	}
	const paramsValidationResult = validate(params, validParams);
	return { valid: paramsValidationResult.valid, errors: paramsValidationResult.errors };
}

router.post('/edit', requiredAdmin('edit meters'), async (req, res) => {
	const response = validateMeterParams(req.body)
	if (!response.valid) {
		log.warn(`Got request to edit a meter with invalid meter data, errors: ${response.errors}`);
		failure(res, 400, 'validation failed with ' + response.errors.toString());
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
				(req.body.previousEnd.length === 0) ? undefined : moment(req.body.previousEnd),
				req.body.unitId,
				req.body.defaultGraphicUnit
			);
			// Put any changed values from updatedMeter into meter.
			_.merge(meter, updatedMeter);
			await meter.update(conn);
			success(res);
		} catch (err) {
			log.error(`Error while editing a meter with detail "${err['detail']}"`, err);
			failure(res, 500, err.toString() + ' with detail ' + err['detail']);
		}
	}
});

/**
 * Route for POST add meter.
 */
router.post('/addMeter', async (req, res) => {
	const response = validateMeterParams(req.body)
	if (!response.valid) {
		log.warn(`Got request to create a meter with invalid meter data, errors: ${response.errors}`);
		failure(res, 400, 'validation failed with ' + response.errors.toString());
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
				req.body.defaultGraphicUnit
			);
			await newMeter.insert(conn);
			success(res);
		} catch (err) {
			log.error(`Error while inserting new meter with detail "${err['detail']}"`, err);
			failure(res, 500, err.toString() + ' with detail ' + err['detail']);
		}
	}
});

module.exports = router;

