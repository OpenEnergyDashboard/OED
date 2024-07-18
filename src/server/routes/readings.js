/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const moment = require('moment');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const TimeInterval = require('../../common/TimeInterval').TimeInterval;
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');

const router = express.Router();

router.get('/line/count/meters/:meter_ids', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string'
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 1,
		required: ['timeInterval'],
		properties: {
			timeInterval: {
				type: 'string'
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			let count = 0;
			for (var i = 0; i < meterIDs.length; i++) {
				const curr = await Reading.getCountByMeterIDAndDateRange(meterIDs[i], timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
				count += curr
			}
			res.send(JSON.stringify(count));
		} catch (err) {
			log.error(`Error while performing GET readings COUNT for line with meters ${meterIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
})

router.get('/line/raw/meter/:meter_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_id'],
		properties: {
			meter_ids: {
				type: 'integer'
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 1,
		required: ['timeInterval'],
		properties: {
			timeInterval: {
				type: 'string'
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		// Get the routed meter id and time for the desired readings.
		const meterID = req.params.meter_id;
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			// Get the raw readings for this meter over time range desired.
			// Note this returns unusual identifiers to save space and does not return the meter id.
			const rawReadings = await Reading.getReadingsByMeterIDAndDateRange(meterID, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
			// They are ready to go back.
			res.send(rawReadings);
		} catch (err) {
			log.error(`Error while performing GET raw readings for line with meter ${meterID} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
});


module.exports = router;

