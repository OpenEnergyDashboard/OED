/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const express = require('express');
const validate = require('jsonschema').validate;
const moment = require('moment');
const { getConnection } = require('../db');

const Reading = require('../models/Reading');

function validateMeterCompareReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string',
				pattern: '^\\d+(?:,\\d+)*$' // Matches 1 or 1,2 or 1,2,34 (for example)
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

function validateGroupCompareReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_ids'],
		properties: {
			group_ids: {
				type: 'string',
				pattern: '^\\d+(?:,\\d+)*$' // Matches 1 or 1,2 or 1,2,34 (for example)
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

function validateQueryParams(queryParams) {
	const validParams = {
		type: 'object',
		maxProperties: 4,
		required: ['curr_start', 'curr_end', 'shift', 'graphicUnitId'],
		properties: {
			curr_start: {
				type: 'string' // iso 8601
			},
			curr_end: {
				type: 'string' // iso 8601
			},
			shift: {
				type: 'string' // iso 8601 duration
			},
			graphicUnitId: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	const paramsValidationResult = validate(queryParams, validParams);
	return paramsValidationResult.valid;
}

/**
 * Gets compare readings for meters for the given current time range and a shift for previous time range
 * @param meterIDs The meter IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param currStart  start of current/this compare period
 * @param currEnd  end of current/this compare period
 * @param shift how far to shift back in time from current period to previous period
 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
 async function meterCompareReadings(meterIDs, graphicUnitId, currStart, currEnd, shift) {
	const conn = getConnection();
	return await Reading.getMeterCompareReadings(meterIDs, graphicUnitId, currStart, currEnd, shift, conn);
}

/**
 * Gets compare readings for groups for the given current time range and a shift for previous time range
 * @param groupIDs The group IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param currStart  start of current/this compare period
 * @param currEnd  end of current/this compare period
 * @param shift how far to shift back in time from current period to previous period
 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
 async function groupCompareReadings(groupIDs, graphicUnitId, currStart, currEnd, shift) {
	const conn = getConnection();
	return await Reading.getGroupCompareReadings(groupIDs, graphicUnitId, currStart, currEnd, shift, conn);
}

function createRouter() {
	const router = express.Router();

	router.get('/meters/:meter_ids', async (req, res) => {
		if (!(validateMeterCompareReadingsParams(req.params) && validateQueryParams(req.query))) {
			res.sendStatus(400);
			return;
		}
		const meterIDs = req.params.meter_ids.split(',').map(id => parseInt(id));
		const graphicUnitID = req.query.graphicUnitId;
		// The string sent should set the timezone to UTC so honor that as OED uses UTC.
		const currStart = moment.parseZone(req.query.curr_start, undefined, true);
		const currEnd = moment.parseZone(req.query.curr_end, undefined, true);
		const shift = moment.duration(req.query.shift);
		res.json(await meterCompareReadings(meterIDs, graphicUnitID, currStart, currEnd, shift));
	});

	router.get('/groups/:group_ids', async (req, res) => {
		if (!(validateGroupCompareReadingsParams(req.params) && validateQueryParams(req.query))) {
			res.sendStatus(400);
			return;
		}
		const conn = getConnection();
		const groupIDs = req.params.group_ids.split(',').map(id => parseInt(id));
		const graphicUnitID = req.query.graphicUnitId;
		// The string sent should set the timezone to UTC so honor that as OED uses UTC.
		const currStart = moment.parseZone(req.query.curr_start, undefined, true);
		const currEnd = moment.parseZone(req.query.curr_end, undefined, true);
		const shift = moment.duration(req.query.shift);
		res.json(await groupCompareReadings(groupIDs, graphicUnitID, currStart, currEnd, shift));
	});

	return router;
}

module.exports = { createRouter };
