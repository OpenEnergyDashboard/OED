/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const express = require('express');
const validate = require('jsonschema').validate;
const _ = require('lodash');

const { getConnection } = require('../db');
const Reading = require('../models/Reading');
const { TimeInterval } = require('../../common/TimeInterval');
const { request } = require('chai');

function validateMeterLineReadingsParams(params) {
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
				pattern: '^\\d+$' //this is the pattern to use!!
			}
		}
	};
	const queryValidationResult = validate(queryParams, validQuery);
	return queryValidationResult.valid;
}

function formatReadingRow(readingRow) {
	return {
		reading: readingRow.reading_rate,
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
	return _.mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatReadingRow));
}

function validateGroupLineReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_ids'],
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
	return _.mapValues(rawReadings, readingsForGroup => readingsForGroup.map(formatReadingRow));
}

function validateMeterBarReadingsParams(params) {
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
	return _.mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatBarReadingRow));
}

function validateGroupBarReadingsParams(params) {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_ids'],
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
	return _.mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatBarReadingRow));
}

/**
 * Gets line readings for meters for the given time range
 * @param meterIDs The meter IDs to get readings for
 * @param graphicUnitId The unit id that the reading should be returned in, i.e., the graphic unit
 * @param timeInterval The range of time to get readings for
 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
 */
async function meterThreeDReadings(meterIDs, graphicUnitId, timeInterval) {
	// TODO Determine the proper format that should be returned
	// TODO Determine proper logic and logic placement.
	// TODO Proper JSDOC return Values
	const conn = getConnection();
	const rawReadings = await Reading.getThreeDReadings(meterIDs, graphicUnitId, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
	return rawReadings;
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

	// function validateMeterId(meter_id) {
	// 	const isValidMeterId = typeof meter_id === 'string' && /^\d+$/.test(meter_id);
	// 	console.log('Is valid id', isValidMeterId);
	// 	return isValidMeterId;
		
	// } 

	function validateMeterId(params) {
		const validParams = {
			type: 'object',
			maxProperties: 3,
			required: ['meter_ids'], ['timeInterval'], ['sequence'],
			properties: {
				meter_ids: {
					type: 'string',
					pattern: '^\\d+$' // Matches 1 or 1,2 or 1,2,34 (for example)
				}
			}
		};
		const paramsValidationResult = validate(params, validParams);
		return paramsValidationResult.valid;
	}
	
	// function validateMeterId(params) {
	// 	const isValidMeterId = {
	// 		type: 'object',
	// 		maxProperties: 1,
	// 		required: [meterID],
	// 		properties: {
	// 			meterID: {
	// 				type: 'string',
	// 				pattern: '^\\d+$'
	// 			}
	// 		}
	// 	};
	// 	const meterValidationResult = validate(meter_id, isValidMeterId);
	// 	return meterValidationResult.valid; // || isValidMeterId;
	// }

	// If multiple integers -> multiple meter ids
	// down the line send multi line readings
	// once params are added Max Properties: 3


	router.get('/threed/meters/:meter_ids', async (req, res) => {
		// if (!(validateThreeDReadingsParams(req.params) && validateThreeDReadingsQueryParams(req.query))) {
		// }
		//const meterID = req.params.meter_ids; ARBITRARILY CHANGE VAL TO RAND #
		console.log('meterID: ', meterID);

		if (!validateMeterId(meterID)) {
			return res.status(400).json({ error: 'Invalid meter_ids parameter' });
		  }
		const meterID = req.params.meterID;  
		const graphicUnitID = req.query.graphicUnitId;
		const timeInterval = TimeInterval.fromString(req.query.timeInterval); //validate these as well
		const forJson = await meterThreeDReadings(meterID, graphicUnitID, timeInterval); //^^
		res.json(forJson);
	});

	return router;
}

module.exports = {
	meterLineReadings,
	validateLineReadingsParams: validateMeterLineReadingsParams,
	validateLineReadingsQueryParams,
	meterBarReadings,
	validateMeterBarReadingsParams: validateMeterBarReadingsParams,
	validateBarReadingsQueryParams,
	createRouter
};
