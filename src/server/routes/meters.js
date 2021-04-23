/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Meter = require('../models/Meter');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const requiredAuthenticator = require('./authenticator').authMiddleware;
const optionalAuthenticator = require('./authenticator').optionalAuthMiddleware;
const Point = require('../models/Point');

const router = express.Router();
router.use(optionalAuthenticator);

/**
 * Defines the format in which we want to send meters and controls what information we send to the client, if logged in or not.
 * @param meter
 * @returns {{id, name}}
 */
function formatMeterForResponse(meter, loggedIn) {
	const formattedMeter = {
		id: meter.id,
		name: null,
		enabled: meter.enabled,
		displayable: meter.displayable,
		ipAddress: null,
		meterType: null,
		timeZone: null,
		gps: meter.gps,
		identifier: meter.identifier
	};

	// Only logged in users can see IP addresses, types, timezones, and internal names
	if (loggedIn) {
		formattedMeter.ipAddress = meter.ipAddress;
		formattedMeter.meterType = meter.type;
		formattedMeter.timeZone = meter.meterTimezone;
		formattedMeter.name = meter.name;
	}

	// TODO: remove this line when usages of meter.name are replaced with meter.identifer
	// Without this, things will break for non-logged in users because we currently rely on
	// the internal name being available. As noted in #605, the intent is to not send the
	// name to a user if they are not logged in.
	formattedMeter.name = meter.name;

	return formattedMeter;
}

/**
 * GET information on displayable meters (or all meters, if logged in)
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	let query;
	if (req.hasValidAuthToken) {
		query = Meter.getAll;
	} else {
		query = Meter.getDisplayable;
	}

	try {
		const rows = await query(conn);
		res.json(rows.map(row => formatMeterForResponse(row, req.hasValidAuthToken)));
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

router.use(requiredAuthenticator);

router.post('/edit', async (req, res) => {
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

module.exports = router;

