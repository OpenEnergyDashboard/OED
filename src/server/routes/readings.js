/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const _ = require('lodash');
const moment = require('moment');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const TimeInterval = require('../../common/TimeInterval').TimeInterval;
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const { formatRawDateToExport } = require('../util/formatDate');

const router = express.Router();

/**
 * Takes in an array of row objects and reformats the timestamp from ISO 8601 format to the number
 * of milliseconds since January 1st, 1970 and groups each reading with each timestamp.
 * @param {Array<Reading>} rows
 */
function formatLineReadings(rows) {
	return rows.map(row => [row.start_timestamp.valueOf(), row.reading_rate]);
}

/**
 * Takes in an array of row objects and reformats the timestamp from ISO 8601 format to the number
 * of milliseconds since January 1st, 1970 and groups each reading with each timestamp.
 * @param {Array<Reading>} rows
 */
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
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		// Instead, we use a lambda function "s => parseInt(s)" so that .map(parseInt) can be recreated without problems.
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			// rawCompressedReadings and formattedCompressedReadings get meters readings and then are formatted into json.
			const rawCompressedReadings = await Reading.getCompressedReadings(meterIDs, timeInterval.startTimestamp, timeInterval.endTimestamp, 100, conn);
			const formattedCompressedReadings = _.mapValues(rawCompressedReadings, formatLineReadings);
			res.json(formattedCompressedReadings);
		} catch (err) {
			log.error(`Error while performing GET readings for line with meters ${meterIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

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

router.get('/line/raw/meters/:meter_ids', async (req, res) => {
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
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		// Again, this is why a lambda function is used so that .map(parseInt) can be recreated without problems.
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			let toReturn = [];
			for (let i = 0; i < meterIDs.length; i++) {
				meterID = meterIDs[i];
				const rawReadings = await Reading.getReadingsByMeterIDAndDateRange(meterID, timeInterval.startTimestamp, timeInterval.endTimestamp, conn)
				const meterLabel = (await Meter.getByID(meterID, conn)).name;
				rawReadings.map(ele => {
					delete ele.meterID;
					ele.label = meterLabel;
					ele.startTimestamp = formatRawDateToExport(ele.startTimestamp);
					delete ele.endTimestamp;
					toReturn.push(ele);
				})
			}
			res.send(toReturn);
		} catch (err) {
			log.error(`Error while performing GET raw readings for line with meters ${meterIDs} with time interval ${timeInterval}: ${err}`, err);
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
			group_ids: {
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
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		// Again, this is why a lambda function is used so that .map(parseInt) can be recreated without problems.
		const groupIDs = req.params.group_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		try {
			// Get group compressed readings and then is formatted into json.
			const rawCompressedReadings = await Reading.getCompressedGroupReadings(
				groupIDs, timeInterval.startTimestamp, timeInterval.endTimestamp, 100, conn);
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
			meter_ids: {
				type: 'string'
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
	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		// Again, this is why a lambda function is used so that .map(parseInt) can be recreated without problems.
		const meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		const barDuration = moment.duration(req.query.barDuration);
		try {
			// Get meters readings and then is formatted into json.
			const barchartReadings = await Reading.getBarchartReadings(meterIDs, barDuration, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
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
			group_ids: {
				type: 'string'
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

	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		// We can't do .map(parseInt) here because map would give parseInt a radix value of the current array position.
		// Again, this is why a lambda function is used so that .map(parseInt) can be recreated without problems.
		const groupIDs = req.params.group_ids.split(',').map(s => parseInt(s));
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		const barDuration = moment.duration(req.query.barDuration);
		try {
			// Get groups readings and then is formatted into json.
			const barchartReadings = await Reading.getGroupBarchartReadings(
				groupIDs, barDuration, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
			const formattedBarchartReadings = _.mapValues(barchartReadings, formatBarReadings);
			res.json(formattedBarchartReadings);
		} catch (err) {
			log.error(`Error while performing GET readings for bar with groups ${groupIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(500);
		}
	}
});


module.exports = router;

