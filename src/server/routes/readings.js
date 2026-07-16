/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { optionalAuthMiddleware } = require('./authenticator');
const Reading = require('../models/Reading');
const TimeInterval = require('../../common/TimeInterval').TimeInterval;
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');
const { STRING_GENERAL_MAX_LENGTH: GENERAL_STRING_MAX_LENGTH, NUMERIC_ID_MAX_LENGTH } = require('../util/validationConstants');
const { HTTP_CODES } = require('../util/httpCodes');
const { isValidTimeInterval } = require('../util/timeValidation');
const { isTokenAuthorized } = require('../util/userRoles');
const Preferences = require('../models/Preferences');
const User = require('../models/User');
const { success, failure } = require('./response');

const router = express.Router();

/**
 * Route for fetching readings count by meter IDs and time interval.
 */
router.get('/line/count/meters/:meter_ids', optionalAuthMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_ids'],
		properties: {
			meter_ids: {
				type: 'string',
				maxLength: GENERAL_STRING_MAX_LENGTH
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 1,
		required: ['timeInterval'],
		properties: {
			timeInterval: {
				type: 'string',
				maxLength: GENERAL_STRING_MAX_LENGTH
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid || !isValidTimeInterval(req.query.timeInterval, true)) {
		res.sendStatus(HTTP_CODES.BAD_REQUEST);
	} else {
		let meterIDs;
		let timeInterval;
		try {
			const conn = getConnection();
			meterIDs = req.params.meter_ids.split(',').map(s => parseInt(s));
			timeInterval = TimeInterval.fromString(req.query.timeInterval);
			let count = 0;
			for (var i = 0; i < meterIDs.length; i++) {
				const curr = await Reading.getCountByMeterIDAndDateRange(meterIDs[i], timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
				count += curr
			}
			// nosemgrep: javascript.express.security.audit.xss.direct-response-write.direct-response-write
			res.send(JSON.stringify(count));
		} catch (err) {
			log.error(`Error while performing GET readings COUNT for line with meters ${meterIDs} with time interval ${timeInterval}: ${err}`, err);
			res.sendStatus(HTTP_CODES.INTERNAL_SERVER_ERROR);
		}
	}
})

/**
 * Route for fetching raw readings by meter ID and time interval.
 */
router.get('/line/raw/meter/:meter_id', optionalAuthMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_id'],
		properties: {
			meter_id: {
				type: 'string',
				pattern: '^\\d+$',
				maxLength: NUMERIC_ID_MAX_LENGTH
			}
		}
	};
	const validQueries = {
		type: 'object',
		maxProperties: 1,
		required: ['timeInterval'],
		properties: {
			timeInterval: {
				type: 'string',
				maxLength: GENERAL_STRING_MAX_LENGTH
			}
		}
	};
	if (!validate(req.params, validParams).valid || !validate(req.query, validQueries).valid) {
		failure(res, HTTP_CODES.BAD_REQUEST);
	} else {
		const conn = getConnection();
		// Get the routed meter id and time for the desired readings.
		const meterID = req.params.meter_id;
		const timeInterval = TimeInterval.fromString(req.query.timeInterval);
		//check if user is allowed to export
		let shouldDownload = false;
		//estimate file size
		//this estimate is also present in src/client/app/components/ExportComponent.tsx and must be kept consistent between files
		const count = await Reading.getCountByMeterIDAndDateRange(meterID, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
		const fileSize = (count * 0.082 / 1000);
		const preferences = await Preferences.get(conn);
		if (fileSize <= preferences.defaultFileSizeLimit) {
			//file size within limit, anyone can download
			shouldDownload = true;
		} else if (req.hasValidAuthToken) {
			//file size above limit, only users with the role EXPORT or ADMIN can download
			const token = req.headers.token || req.body.token || req.query.token;
			if (await isTokenAuthorized(token, User.role.EXPORT)) {
				shouldDownload = true;
			}
		}
		if (shouldDownload == false) {
			failure(res, HTTP_CODES.FORBIDDEN);
			return;
		}
		try {
			// Get the raw readings for this meter over time range desired.
			// Note this returns unusual identifiers to save space and does not return the meter id.
			const rawReadings = await Reading.getReadingsByMeterIDAndDateRange(meterID, timeInterval.startTimestamp, timeInterval.endTimestamp, conn);
			// They are ready to go back.
			// nosemgrep: javascript.express.security.audit.xss.direct-response-write.direct-response-write
			success(res, rawReadings);
		} catch (err) {
			log.error(`Error while performing GET raw readings for line with meter ${meterID} with time interval ${timeInterval}: ${err}`, err);
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR);
		}
	}
});


module.exports = router;
