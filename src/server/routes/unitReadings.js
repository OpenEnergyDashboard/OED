/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const express = require('express');
const validate = require('jsonschema').validate;
const mapValues = require('lodash/mapValues');
const { getConnection } = require('../db');
const Reading = require('../models/Reading');
const { TimeInterval } = require('../../common/TimeInterval');
const moment = require('moment');

function validateMeterLineReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string',
				// Matches 1 or more integers separated by commas
				pattern: '^\\d+(?:,\\d+)*$'
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

function validateLineReadingsQueryParams(queryParams) {
	const validQuery = {
		type: 'object',
		maxProperties: 2,
		required: ['timeInterval', 'graphicUnitId'],
		properties: {
			timeInterval: {
				type: 'string'
			},
			graphicUnitId: {
				type: 'string',
				// Matches a single integer value
				pattern: '^\\d+$'
			}
		}
	};
	const queryValidationResult = validate(queryParams, validQuery);
	return queryValidationResult.valid;
}

function formatReadingRow(readingRow) {
	return {
		reading: readingRow.reading_rate,
		min: readingRow.min_rate,
		max: readingRow.max_rate,
		// This returns a Unix timestamp in milliseconds. This should be smaller in size when sent to the client
		// compared to sending the formatted moment object. All values are sent as a string.
		// The consequence of doing this is that when the client recreates this as a moment it will do it in
		// the local timezone of the client. That is why the client code generally uses moment.utc().
		startTimestamp: readingRow.start_timestamp.valueOf(),
		endTimestamp: readingRow.end_timestamp.valueOf()
	};
}

/**
 * Gets line readings for meters for the given time range
 * @param meterIDs The meter IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param timeInterval The range of time to get readings for
 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
async function meterLineReadings(meterIDs, graphicUnitId, timeInterval) {
	const conn = getConnection();
	const rawReadings = await Reading.getMeterLineReadings(meterIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
	return mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatReadingRow));
}

function validateGroupLineReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_ids'],
		properties: {
			meter_ids: {
				type: 'string',
				// Matches 1 or more integers separated by commas
				pattern: '^\\d+(?:,\\d+)*$'
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

/**
 * Gets line readings for groups for the given time range
 * @param groupIDs The group IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param timeInterval The range of time to get readings for
 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
async function groupLineReadings(groupIDs, graphicUnitId, timeInterval) {
	const conn = getConnection();
	const rawReadings = await Reading.getGroupLineReadings(groupIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
	return mapValues(rawReadings, readingsForGroup => readingsForGroup.map(formatReadingRow));
}

function validateMeterBarReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string',
				// Matches 1 or more integers separated by commas
				pattern: '^\\d+(?:,\\d+)*$'
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

function validateBarReadingsQueryParams(queryParams) {
	const validQuery = {
		type: 'object',
		maxProperties: 3,
		required: ['timeInterval', 'barWidthDays', 'graphicUnitId'],
		properties: {
			timeInterval: {
				type: 'string'
			},
			barWidthDays: {
				type: 'string',
				pattern: '^\\d+$'
			},
			graphicUnitId: {
				type: 'string',
				// Matches a single integer value
				pattern: '^\\d+$'
			}
		}
	};
	const queryValidationResult = validate(queryParams, validQuery);
	return queryValidationResult.valid;
}

function formatBarReadingRow(readingRow) {
	return {
		reading: readingRow.reading,
		startTimestamp: readingRow.start_timestamp.valueOf(),
		endTimestamp: readingRow.end_timestamp.valueOf()
	};
}

/**
 * Gets bar readings for meters for the given time range
 * @param meterIDs The meter IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param barWidthDays The width of the bar in days
 * @param timeInterval The range of time to get readings for
 * @returns {Promise<object<int, array<{reading_rate: number: number. end_timestamp: number} in sorted order
 */
async function meterBarReadings(meterIDs, graphicUnitId, barWidthDays, timeInterval) {
	const conn = getConnection();
	const rawReadings = await Reading.getMeterBarReadings(
		meterIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, barWidthDays, conn);
	return mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatBarReadingRow));
}

function validateGroupBarReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_ids'],
		properties: {
			meter_ids: {
				type: 'string',
				// Matches 1 or more integers separated by commas
				pattern: '^\\d+(?:,\\d+)*$'
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

/**
 * Gets bar readings for groups for the given time range
 * @param groupIDs The group IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param barWidthDays The width of the bar in days
 * @param timeInterval The range of time to get readings for
 * @returns {Promise<object<int, array<{reading_rate: number: number. end_timestamp: number} in sorted order
 */
async function groupBarReadings(groupIDs, graphicUnitId, barWidthDays, timeInterval) {
	const conn = getConnection();
	const rawReadings = await Reading.getGroupBarReadings(
		groupIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, barWidthDays, conn);
	return mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatBarReadingRow));
}

function validateMeterRadarReadingsParams(params) {
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

function validateRadarReadingsQueryParams(queryParams) {
	const validQuery = {
		type: 'object',
		maxProperties: 2,
		required: ['timeInterval', 'graphicUnitId'],
		properties: {
			timeInterval: {
				type: 'string'
			},
			graphicUnitId: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	const queryValidationResult = validate(queryParams, validQuery);
	return queryValidationResult.valid;
}

function formatRadarReadingRow(readingRow) {
	return {
		reading: readingRow.reading_rate,
		startTimestamp: readingRow.start_timestamp.valueOf(),
		endTimestamp: readingRow.end_timestamp.valueOf()
	};
}

/**
 * Gets radar readings for meters for the given time range
 * @param meterIDs The meter IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param timeInterval The range of time to get readings for
 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
async function meterRadarReadings(meterIDs, graphicUnitId, timeInterval) {
	const conn = getConnection();
	const rawReadings = await Reading.getMeterRadarReadings(meterIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
	return mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatRadarReadingRow));
}

function validateGroupRadarReadingsParams(params) {
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

/**
 * Gets radar readings for groups for the given time range
 * @param groupIDs The group IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param timeInterval The range of time to get readings for
 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
async function groupRadarReadings(groupIDs, graphicUnitId, timeInterval) {
	const conn = getConnection();
	const rawReadings = await Reading.getGroupRadarReadings(groupIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
	return mapValues(rawReadings, readingsForGroup => readingsForGroup.map(formatRadarReadingRow));
}

/**
 * Gets hour or multiple hour readings for meters for the given time range
 * @param meterIDs The meter IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param timeInterval The range of time to get readings for
 * @param readingInterval rate of hours per reading
 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
async function meterThreeDReadings(meterIDs, graphicUnitId, timeInterval, readingInterval) {
	const conn = getConnection();
	const hourlyReadings = await Reading.getThreeDReadings(meterIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, readingInterval, conn);
	return hourlyReadings;
}

/**
 * Gets hour or multiple hour readings for group for the given time range
 * @param groupID The group ID to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param timeInterval The range of time to get readings for
 * @param readingInterval rate of hours per reading
 * @returns {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
async function groupThreeDReadings(groupID, graphicUnitId, timeInterval, readingInterval) {
	const conn = getConnection();
	const groupThreeDReadings = await Reading.getGroupThreeDReadings(groupID, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, readingInterval, conn);
	return groupThreeDReadings;
}

function validateMeterThreeDReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string',
				// Matches a single integer value
				pattern: '^\\d+$'
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

function validateGroupThreeDReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_id'],
		properties: {
			meter_ids: {
				type: 'string',
				// Matches a single integer value
				pattern: '^\\d+$'
			}
		}
	};
	const paramsValidationResult = validate(params, validParams);
	return paramsValidationResult.valid;
}

function validateThreeDQueryParams(queryParams) {
	const validParams = {
		type: 'object',
		maxProperties: 3,
		required: ['timeInterval', 'graphicUnitId', 'readingInterval'],
		properties: {
			timeInterval: {
				type: 'string',
			},
			graphicUnitID: {
				type: 'string',
				// Matches a single integer value
				pattern: '^\\d+$'
			},
			readingInterval: {
				type: 'string',
				// for reference regarding this pattern: https://json-schema.org/understanding-json-schema/reference/regular_expressions.html
				// Matches divisors of 24: 1, 2, 3, 4, 6, 8 or 12 but not 24
				pattern: '^([123468]|[1][2])$'
			}
		}
	};
	const paramsValidationResult = validate(queryParams, validParams);
	return paramsValidationResult.valid;
}

function createRouter() {
	const router = express.Router();
	router.get('/line/meters/:meter_ids', async (req, res) => {
		if (!(validateMeterLineReadingsParams(req.params) && validateLineReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const meterIDs = req.params.meter_ids.split(',').map(idStr => Number(idStr));
			const graphicUnitID = req.query.graphicUnitId;
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const forJson = await meterLineReadings(meterIDs, graphicUnitID, timeInterval);
			res.json(forJson);
		}
	});

	router.get('/line/groups/:group_ids', async (req, res) => {
		if (!(validateGroupLineReadingsParams(req.params) && validateLineReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const groupIDs = req.params.group_ids.split(',').map(idStr => Number(idStr));
			const graphicUnitID = req.query.graphicUnitId;
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const forJson = await groupLineReadings(groupIDs, graphicUnitID, timeInterval);
			res.json(forJson);
		}
	});

	router.get('/bar/meters/:meter_ids', async (req, res) => {
		if (!(validateMeterBarReadingsParams(req.params) && validateBarReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const meterIDs = req.params.meter_ids.split(',').map(idStr => Number(idStr));
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const barWidthDays = Number(req.query.barWidthDays);
			const graphicUnitID = req.query.graphicUnitId;
			const forJson = await meterBarReadings(meterIDs, graphicUnitID, barWidthDays, timeInterval);
			res.json(forJson);
		}
	});

	router.get('/bar/groups/:group_ids', async (req, res) => {
		if (!(validateGroupBarReadingsParams(req.params) && validateBarReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const groupIDs = req.params.group_ids.split(',').map(idStr => Number(idStr));
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const barWidthDays = Number(req.query.barWidthDays);
			const graphicUnitID = req.query.graphicUnitId;
			const forJson = await groupBarReadings(groupIDs, graphicUnitID, barWidthDays, timeInterval);
			res.json(forJson);
		}
	});

	router.get('/radar/meters/:meter_ids', async (req, res) => {
		if (!(validateMeterRadarReadingsParams(req.params) && validateRadarReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const meterIDs = req.params.meter_ids.split(',').map(idStr => Number(idStr));
			const graphicUnitID = req.query.graphicUnitId;
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const forJson = await meterRadarReadings(meterIDs, graphicUnitID, timeInterval);
			res.json(forJson);
		}
	});

	router.get('/radar/groups/:group_ids', async (req, res) => {
		if (!(validateGroupRadarReadingsParams(req.params) && validateRadarReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const groupIDs = req.params.group_ids.split(',').map(idStr => Number(idStr));
			const graphicUnitID = req.query.graphicUnitId;
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const forJson = await groupRadarReadings(groupIDs, graphicUnitID, timeInterval);
			res.json(forJson);
		}
	});

	router.get('/threeD/meters/:meter_ids', async (req, res) => {
		if (!(validateMeterThreeDReadingsParams(req.params) && validateThreeDQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			// Get time range to validate 1 year or less.
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			if (!timeInterval.getIsBounded()) {
				// Cannot do if not bounded.
				res.sendStatus(400);
			} else {
				const duration = moment.duration(timeInterval.endTimestamp.diff(timeInterval.startTimestamp));
				// Gets 0 unless one day beyond a year but that okay since don't do partial days.
				const durationInYears = duration.years();
				if (durationInYears >= 1) {
					// Limit 3D to one year of data.
					res.sendStatus(400);
				} else {
					const meterIDs = req.params.meter_ids.split(',').map(idStr => Number(idStr));
					const graphicUnitID = req.query.graphicUnitId;
					const readingInterval = req.query.readingInterval;
					const forJson = await meterThreeDReadings(meterIDs, graphicUnitID, timeInterval, readingInterval);
					res.json(forJson);
				}
			}
		}
	});

	router.get('/threeD/groups/:group_id', async (req, res) => {
		if (!(validateGroupThreeDReadingsParams(req.params) && validateThreeDQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			// Get time range to validate 1 year or less.
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			if (!timeInterval.getIsBounded()) {
				// Cannot do if not bounded.
				res.sendStatus(400);
			} else {
				const duration = moment.duration(timeInterval.endTimestamp.diff(timeInterval.startTimestamp));
				// Gets 0 unless one day beyond a year but that okay since don't do partial days.
				const durationInYears = duration.years();
				if (durationInYears >= 1) {
					// Limit 3D to one year of data.
					res.sendStatus(400);
				} else {
					const groupID = req.params.group_id;
					const graphicUnitID = req.query.graphicUnitId;
					const readingInterval = req.query.readingInterval;
					const forJson = await groupThreeDReadings(groupID, graphicUnitID, timeInterval, readingInterval);
					res.json(forJson);
				}
			}
		}
	});

	return router;
}

module.exports = {
	meterLineReadings,
	meterRadarReadings,
	validateLineReadingsParams: validateMeterLineReadingsParams,
	validateLineReadingsQueryParams,
	meterBarReadings,
	validateMeterBarReadingsParams: validateMeterBarReadingsParams,
	validateBarReadingsQueryParams,
	meterThreeDReadings,
	groupThreeDReadings,
	validateMeterThreeDReadingsParams,
	validateGroupThreeDReadingsParams,
	validateThreeDQueryParams,
	createRouter
};
