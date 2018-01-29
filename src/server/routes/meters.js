/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Meter = require('../models/Meter');
const { log } = require('../log');

const router = express.Router();

/**
 * Defines the format in which we want to send meters and controls what information we send to the client.
 * @param meter
 * @returns {{id, name}}
 */
function formatMeterForResponse(meter) {
	return { id: meter.id, name: meter.name };
}

/**
 * GET information on all meters
 */
router.get('/', async (req, res) => {
	try {
		const rows = await Meter.getAll();
		res.json(rows.map(formatMeterForResponse));
	} catch (err) {
		log.error(`Error while performing GET all meters query: ${err}`, err);
	}
});

/**
 * GET information for a specific meter by id
 * @param {int} meter_id
 */
router.get('/:meter_id', async (req, res) => {
	try {
		const meter = await Meter.getByID(req.params.meter_id);
		res.json(formatMeterForResponse(meter));
	} catch (err) {
		log.error(`Error while performing GET specific meter by id query: ${err}`, err);
	}
});

module.exports = router;
