/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const _ = require('lodash');
const moment = require('moment');
const Reading = require('../models/Reading');
const TimeInterval = require('../../common/TimeInterval');
const { log } = require('../log');
const validate = require('jsonschema').validate;

const router = express.Router();

/**
 * Takes in an array of row objects and reformats the timestamp from ISO 8601 format to the number
 * of milliseconds since January 1st, 1970 and groups each reading with each timestamp.
 * @param {Array<Reading>} rows
 */
function formatLineReadings(rows) {
	return rows.map(row => [row.start_timestamp.valueOf(), row.reading_rate]);
}

function formatBarReadings(rows) {
	return rows.map(row => [row.start_timestamp.valueOf(), row.reading_sum]);
}

/**
 * GET meter readings by meter id for line chart
 * @param {array.<int>} meter_ids
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 */
router.get('/line/meters/:meter_ids', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			group_id: {
				type: 'number'
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
	if (!validate(req.params, validParams).valid || !validate(validQueries, req.query).valid) {
		res.sendStatus(400);
	} else {
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			const rawCompressedReadings = await Reading.getCompressedReadings(meterIDs, timeInterval.startTimestamp, timeInterval.endTimestamp, 100);
			const formattedCompressedReadings = _.mapValues(rawCompressedReadings, formatLineReadings);
			res.json(formattedCompressedReadings);
		} catch (err) {
			log.error(`Error while performing GET readings for line with meters ${meterIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
});


/**
 * GET group readings by meter id for line chart
 * @param {array.<int>} meter_ids
 * @param {TimeInterval} [timeInterval]
 */
router.get('/line/groups/:group_ids', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_ids'],
		properties: {
			group_id: {
				type: 'number'
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
	if (!validate(req.params, validParams).valid || !validate(validQueries, req.query).valid) {
		res.sendStatus(400);
	} else {
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		const groupIDs = req.params.group_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			const rawCompressedReadings = await Reading.getCompressedGroupReadings(groupIDs, timeInterval.startTimestamp, timeInterval.endTimestamp, 100);
			const formattedCompressedReadings = _.mapValues(rawCompressedReadings, formatLineReadings);
			res.json(formattedCompressedReadings);
		} catch (err) {
			log.error(`Error while performing GET readings for line with groups ${groupIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
});


/**
 * GET meter readings by meter id for bar chart
 * @param {array.<int>} meter_ids
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 */
router.get('/bar/meters/:meter_ids', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			group_id: {
				type: 'number'
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 2,
		required: ['timeInterval', 'barDuration'],
		properties: {
			timeInterval: {
				type: 'string'
			},
			barDuration: {
				type: 'string'
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(validQueries, req.query).valid) {
		res.sendStatus(400);
	} else {
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		const barDuration = moment.duration(req.query.barDuration);
		try {
			const barchartReadings = await Reading.getBarchartReadings(meterIDs, barDuration, timeInterval.startTimestamp, timeInterval.endTimestamp);
			const formattedBarchartReadings = _.mapValues(barchartReadings, formatBarReadings);
			res.json(formattedBarchartReadings);
		} catch (err) {
			log.error(`Error while performing GET readings for bar with meters ${meterIDs} with time interval ${timeInterval}: ${err}`);
			res.sendStatus(500);
		}
	}
});


/**
 * GET meter readings by meter id for bar chart
 * @param {array.<int>} meter_ids
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 */
router.get('/bar/groups/:group_ids', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_ids'],
		properties: {
			group_id: {
				type: 'number'
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 2,
		required: ['timeInterval', 'barDuration'],
		properties: {
			timeInterval: {
				type: 'string'
			},
			barDuration: {
				type: 'string'
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(validQueries, req.query).valid) {
		res.sendStatus(400);
	} else {
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		const groupIDs = req.params.group_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		const barDuration = moment.duration(req.query.barDuration);
		try {
			const barchartReadings = await Reading.getGroupBarchartReadings(
				groupIDs, barDuration, timeInterval.startTimestamp, timeInterval.endTimestamp);
			const formattedBarchartReadings = _.mapValues(barchartReadings, formatBarReadings);
			res.json(formattedBarchartReadings);
		} catch (err) {
			log.error(`Error while performing GET readings for bar with groups ${groupIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
});


module.exports = router;
