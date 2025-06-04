/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const express = require('express');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const adminAuthenticator = require('./authenticator').adminAuthMiddleware;
const LogMsg = require('../models/LogMsg');
const { getConnection } = require('../db');
const { TimeInterval } = require('../../common/TimeInterval');

const router = express.Router();
router.use(adminAuthenticator('log API'));

const validLog = {
	type: 'object',
	required: ['message'],
	properties: {
		message: {
			type: 'string',
			minLength: 1
		}
	}
}

const validLogMsg = {
	type: 'object',
	required: ['timeInterval', 'logTypes', 'logLimit'],
	maxProperties: 3,
	properties: {
		timeInterval: {
			// it should check for format: 'date-time' but this won't work for case where time is not provided
			// when time is not provided, timeInterval value will be 'all' so just check type is string for now
			type: 'string',
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
router.post('/info', async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.info(req.body.message);
		res.sendStatus(200);
	} else {
		log.error('invalid input from client logger');
		res.sendStatus(400);
	}
});

router.post('/warn', async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.warn(req.body.message);
		res.sendStatus(200);
	} else {
		log.error('invalid input from client logger');
		res.sendStatus(400);
	}
});

router.post('/error', async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.error(req.body.message);
		res.sendStatus(200);
	} else {
		log.error('invalid input from client logger');
		res.sendStatus(400);
	}
});

router.get('/logsmsg/getLogsByDateRangeAndType', async (req, res) => {
	const validationResult = validate(req.query, validLogMsg);
	if (!validationResult.valid) {
		log.error('invalid request to getLogsByDateRangeAndType');
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			const logLimit = parseInt(req.query.logLimit);
			const timeInterval = TimeInterval.fromString(req.query.timeInterval);
			const logTypes = req.query.logTypes.split(',');
			const rows = await LogMsg.getLogsByDateRangeAndType(
				timeInterval.startTimestamp, timeInterval.endTimestamp, logTypes, logLimit, conn);
			res.json(rows);
		} catch (err) {
			log.error(`Failed to fetch logs filter by date range and type: ${err}`);
			res.sendStatus(500);
		}
	}
});

module.exports = router;
