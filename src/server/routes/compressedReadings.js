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


function validateLineReadingsParams(params) {
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
		maxProperties: '1',
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

function createRouter() {
	const router = express.Router();
	router.get('/line/meters/:meter_ids', async (req, res) => {
		if (!(validateLineReadingsParams(req.params) && validateLineReadingsQueryParams(req.query))) {
			res.sendStatus(400);
		} else {
			const meterIDs = req.params.meter_ids.split(',').map(idStr => Number(idStr));
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const forJson = await compressedLineReadings(meterIDs, timeInterval);
			res.json(forJson);
		}
	});
	return router;
}

module.exports = {
	compressedLineReadings,
	validateLineReadingsParams,
	validateLineReadingsQueryParams,
	createRouter
};
