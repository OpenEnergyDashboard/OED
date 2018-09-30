/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Meter = require('../models/Meter');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const authenticator = require('./authenticator').optionalAuthMiddleware;

const router = express.Router();
router.use(authenticator);

/**
 * Defines the format in which we want to send meters and controls what information we send to the client, if logged in or not.
 * @param meter
 * @returns {{id, name}}
 */
function formatMeterForResponse(meter, loggedIn) {
	const formattedMeter = {
		id: meter.id,
		name: meter.name,
		enabled: meter.enabled,
		displayable: meter.displayable,
		ipAddress: null,
		meterType: null
	};

	// Only logged in users can see IP addresses and types
	if (loggedIn) {
		formattedMeter.ipAddress = meter.ipAddress;
		formattedMeter.meterType = meter.type;
	}

	return formattedMeter;
}

/**
 * GET information on displayable meters (or all meters, if logged in)
 */
router.get('/', async (req, res) => {
	let query;
	if (req.hasValidAuthToken) {
		query = Meter.getAll;
	} else {
		query = Meter.getDisplayable;
	}

	try {
		const rows = await query();
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
		try {
			const meter = await Meter.getByID(req.params.meter_id);
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

module.exports = router;
