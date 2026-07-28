/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const express = require('express');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');
const LogMsg = require('../models/LogMsg');
const { getConnection } = require('../db');
const { TimeInterval } = require('../../common/TimeInterval');
const { STRING_GENERAL_MAX_LENGTH } = require('../util/validationConstants');
const { HTTP_CODES } = require('../util/httpCodes');
const { isValidTimeInterval } = require('../util/timeValidation');
const { success, failure } = require('./response');

const router = express.Router();

const validLog = {
	type: 'object',
	required: ['message'],
	properties: {
		message: {
			type: 'string',
			minLength: 1,
			maxLength: STRING_GENERAL_MAX_LENGTH
		}
	}
};

const validLogMsg = {
	type: 'object',
	required: ['timeInterval', 'logTypes', 'logLimit'],
	maxProperties: 3,
	properties: {
		timeInterval: {
			type: 'string',
			maxLength: STRING_GENERAL_MAX_LENGTH
		},
		logTypes: {
			type: 'string',
			pattern: '^(INFO|WARN|ERROR|SILENT|DEBUG)(,(INFO|WARN|ERROR|SILENT|DEBUG))*$'
		},
		logLimit: {
			type: 'string',
			// as logLimit is being sent as string, using pattern to validate it represents a number from 1 to 1000
			pattern: '^(?:[1-9][0-9]{0,2}|1000)$'
		},
	}
}

router.post('/info', adminAuthMiddleware('create info log'), async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.info(req.body.message);
		success(res);
	} else {
		failure(res, HTTP_CODES.BAD_REQUEST, 'invalid input from client logger');
	}
});

router.post('/warn', adminAuthMiddleware('create warn log'), async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.warn(req.body.message);
		success(res);
	} else {
		failure(res, HTTP_CODES.BAD_REQUEST, 'invalid input from client logger');
	}
});

router.post('/error', adminAuthMiddleware('create error log'), async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.error(req.body.message);
		success(res);
	} else {
		failure(res, HTTP_CODES.BAD_REQUEST, 'invalid input from client logger');
	}
});

router.get('/logsmsg/getLogsByDateRangeAndType', adminAuthMiddleware('view logs'), async (req, res) => {
	const validationResult = validate(req.query, validLogMsg);
	if (!validationResult.valid || !isValidTimeInterval(req.query.timeInterval)) {
		failure(res, HTTP_CODES.BAD_REQUEST, 'invalid request to getLogsByDateRangeAndType');
	} else {
		try {
			const conn = getConnection();
			const logLimit = parseInt(req.query.logLimit);
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const logTypes = req.query.logTypes.split(',');
			const rows = await LogMsg.getLogsByDateRangeAndType(
				timeInterval.startTimestamp, timeInterval.endTimestamp, logTypes, logLimit, conn
			);
			success(res, rows);
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Failed to fetch logs filtered by date range and type: ${err.message}`, { cause: err }));
		}
	}
});

module.exports = router;
