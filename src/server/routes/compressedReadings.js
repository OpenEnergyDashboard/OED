/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const express = require('express');
const validate = require('jsonschema').validate;
const _ = require('lodash');

const Reading = require('../models/Reading');
const { TimeInterval } = require('../../common/TimeInterval');


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
		maxProperties: 1,
		required: ['timeInterval'],
		properties: {
			timeInterval: {
				type: 'string'
			}
		}
	};
	const queryValidationResult = validate(queryParams, validQuery);
	return queryValidationResult.valid;
}

function formatCompressedReadingRow(readingRow) {
	return {
		reading: readingRow.reading_rate,
		startTimestamp: readingRow.start_timestamp.valueOf(),
		endTimestamp: readingRow.end_timestamp.valueOf()
	}
}

async function compressedLineReadings(meterIDs, timeInterval) {
	const rawReadings = await Reading.getNewCompressedReadings(meterIDs, timeInterval.startTimestamp, timeInterval.endTimestamp);
	return _.mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatCompressedReadingRow));
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

async function compressedGroupLineReadings(groupIDs, timeInterval) {
	const rawReadings = await Reading.getNewCompressedGroupReadings(groupIDs, timeInterval.startTimestamp, timeInterval.endTimestamp);
	return _.mapValues(rawReadings, readingsForGroup => readingsForGroup.map(formatCompressedReadingRow));
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
		maxProperties: 2,
		required: ['timeInterval', 'barWidthDays'],
		properties: {
			timeInterval: {
				type: 'string'
			},
			barWidthDays: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	const queryValidationResult = validate(queryParams, validQuery);
	return queryValidationResult.valid;
}

function formatCompressedBarReadingRow(readingRow) {
	return {
		reading: readingRow.reading,
		startTimestamp: readingRow.start_timestamp.valueOf(),
		endTimestamp: readingRow.end_timestamp.valueOf()
	}
}

async function compressedMeterBarReadings(meterIDs, barWidthDays, timeInterval) {
	const rawReadings = await Reading.getNewCompressedBarchartReadings(meterIDs, timeInterval.startTimestamp, timeInterval.endTimestamp, barWidthDays);
	return _.mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatCompressedBarReadingRow));
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

async function compressedGroupBarReadings(groupIDs, barWidthDays, timeInterval) {
	const rawReadings = await Reading.getNewCompressedBarchartGroupReadings(groupIDs, timeInterval.startTimestamp, timeInterval.endTimestamp, barWidthDays);
	return _.mapValues(rawReadings, readingsForMeter => readingsForMeter.map(formatCompressedBarReadingRow));
}

function createRouter() {
	const router = express.Router();
	router.get('/line/meters/:meter_ids', async (req, res) => {
		if (!(validateMeterLineReadingsParams(req.params) && validateLineReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const meterIDs = req.params.meter_ids.split(',').map(idStr => Number(idStr));
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const forJson = await compressedLineReadings(meterIDs, timeInterval);
			res.json(forJson);
		}
	});

	router.get('/line/groups/:group_ids', async (req, res) => {
		if (!(validateGroupLineReadingsParams(req.params) && validateLineReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const groupIDs = req.params.group_ids.split(',').map(idStr => Number(idStr));
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const forJson = await compressedGroupLineReadings(groupIDs, timeInterval);
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
			const forJson = await compressedMeterBarReadings(meterIDs, barWidthDays, timeInterval);
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
			const forJson = await compressedGroupBarReadings(groupIDs, barWidthDays, timeInterval);
			res.json(forJson);
		}
	});

	return router;
}

module.exports = {
	compressedLineReadings,
	validateLineReadingsParams: validateMeterLineReadingsParams,
	validateLineReadingsQueryParams,
	createRouter
};
