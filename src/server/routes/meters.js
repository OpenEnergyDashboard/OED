/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const _ = require('lodash');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const TimeInterval = require('../../common/TimeInterval');

const router = express.Router();

/**
 * Takes in an array of row objects and reformats the timestamp from ISO 8601 format to the number
 * of milliseconds since January 1st, 1970 and groups each reading with each timestamp.
 * @param {Array<Reading>} rows
 */
function formatReadings(rows) {
	return rows.map(row => [row.start_timestamp.valueOf(), row.reading_rate]);
}

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
		console.error(`Error while performing GET all meters query: ${err}`);
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
		console.error(`Error while performing GET specific meter by id query: ${err}`);
	}
});

/**
 * GET meter readings by meter id
 * @param {array.<int>} meter_ids
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 */
router.get('/readings/:meter_ids', async (req, res) => {
	// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
	const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
	const timeInterval = TimeInterval.fromString(req.query.timeInterval);
	try {
		const rawCompressedReadings = await Reading.getCompressedReadings(meterIDs, timeInterval.startTimestamp, timeInterval.endTimestamp, 100);
		const formattedCompressedReadings = _.mapValues(rawCompressedReadings, formatReadings);
		res.json(formattedCompressedReadings);
	} catch (err) {
		console.error(`Error while performing GET readings for meters ${meterIDs} with time interval ${timeInterval}: ${err}`);
	}
});

module.exports = router;
