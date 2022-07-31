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
	}

	// TODO: remove this line when usages of meter.name are replaced with meter.identifer
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

router.post('/edit', requiredAdmin('edit meters'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 6,
		required: ['id', 'enabled', 'displayable', 'timeZone'],
		properties: {
			id: { type: 'integer' },
			enabled: { type: 'bool' },
			displayable: { type: 'bool' },
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
			}
		}
	};

	const validatorResult = validate(req.body, validParams);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit meters with invalid meter data, errors:${validatorResult.errors}`);
		res.status(400);
	} else {
		const conn = getConnection();
		try {
			const meter = await Meter.getByID(req.body.id, conn);
			meter.enabled = req.body.enabled;
			meter.displayable = req.body.displayable;
			meter.meterTimezone = req.body.timeZone;
			meter.gps = (req.body.gps) ? new Point(req.body.gps.longitude, req.body.gps.latitude) : null;
			meter.identifier = req.body.identifier;
			await meter.update(conn);
		} catch (err) {
			log.error('Failed to edit meter', err);
			res.status(500).json({ message: 'Unable to edit meters.', err });
		}
		res.status(200).json({ message: `Successfully edited meter ${req.body.id}` });
	}
});

/**
 * Route for POST add unit.
 */
router.post('/addMeter', async (req, res) => {
	const validParams = {
		type: 'object',
		// TODO why does this not work?
		// maxProperties: 25,
		required: ['id', 'enabled', 'displayable', 'timeZone'],
		properties: {
			enabled: { type: 'bool' },
			displayable: { type: 'bool' },
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
					{
						type: 'null'
					}
				]
			},
			identifier: {
				oneOf: [
					{ type: 'string' },
				]
			}
		}
	};

	const validationResult = validate(req.body, validParams);
	if (!validationResult.valid) {
		log.error(`Invalid input for meterAPI. ${validationResult.error}`);
		res.sendStatus(400);
	} else {
		let gpsUse = req.body.gps;
		if (gpsUse != null) {
			// Valid GPS so convert to a point
			gpsUse = new Point(req.body.gps.longitude, req.body.gps.latitude);
		}
		const conn = getConnection();
		const startTimeReceived = req.body.startTimestamp, endTimeReceived = req.body.endTimestamp;
		let startTime, endTime;
		if (startTimeReceived.length === 0) {
			startTime = undefined;
		} else {
			startTime = moment(startTimeReceived)
		}
		if (endTimeReceived.length === 0) {
			endTime = undefined;
		} else {
			endTime = moment(endTimeReceived)
		}
		let cumulativeStart = req.body.cumulativeResetStart, cumulativeEnd = req.body.cumulativeResetEnd;
		if (cumulativeStart.length === 0) {
			cumulativeStart = undefined;
		}
		if (cumulativeEnd.length === 0) {
			cumulativeEnd = undefined;
		}

		try {
			await conn.tx(async t => {
				const newMeter = new Meter(
					undefined, //id
					req.body.name,
					req.body.url,
					req.body.enabled,
					req.body.displayable,
					req.body.meterType,
					req.body.timeZone,
					gpsUse,
					req.body.identifier,
					req.body.note,
					req.body.area,
					req.body.cumulative,
					req.body.cumulativeReset,
					cumulativeStart,
					cumulativeEnd,
					req.body.readingGap,
					req.body.readingVariation,
					req.body.readingDuplication,
					req.body.timeSort,
					req.body.endOnlyTime,
					req.body.reading,
					startTime,
					endTime,
					req.body.unitId,
					req.body.defaultGraphicUnit
				);
				await newMeter.insert(t);
			});
			res.sendStatus(200);
		} catch (err) {
			log.error(`Error while inserting new meter ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;

