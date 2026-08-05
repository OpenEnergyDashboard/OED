/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { getConnection } = require('../db');
const express = require('express');
const Baseline = require('../models/Baseline');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');
const { STRING_GENERAL_MAX_LENGTH } = require('../util/validationConstants');
const { HTTP_CODES } = require('../util/httpCodes');
const { isValidIsoDateTime } = require('../util/timeValidation');
const { success, failure } = require('./response');
const router = express.Router();
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rawBaselines = await Baseline.getAllBaselines(conn);
		success(res, rawBaselines);
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while getting all baselines: ${err.message}`, { cause: err }));
	}
});
router.post('/new', adminAuthMiddleware('create baselines'), async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		maxProperties: 6,
		required: ['meterID', 'applyStart', 'applyEnd', 'calcStart', 'calcEnd'],
		properties: {
			meterID: {
				type: 'integer',
				minimum: 1
			},
			applyStart: {
				type: 'string',
				maxLength: STRING_GENERAL_MAX_LENGTH
			},
			applyEnd: {
				type: 'string',
				maxLength: STRING_GENERAL_MAX_LENGTH
			},
			calcStart: {
				type: 'string',
				maxLength: STRING_GENERAL_MAX_LENGTH
			},
			calcEnd: {
				type: 'string',
				maxLength: STRING_GENERAL_MAX_LENGTH
			},
			note: {
				oneOf: [
					{ type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
					{ type: 'null' }
				]
			}
		}
	};

	if (!validate(req.body, validParams).valid) {
		failure(res, HTTP_CODES.BAD_REQUEST);
		return;
	}
	// baseline.js does not use moment; validate date strings directly
	// TODO This might not stay and is not used in OED now but need to see if it has a timezone for the check.
	if (!isValidIsoDateTime(req.body.applyStart) || !isValidIsoDateTime(req.body.applyEnd) ||
		!isValidIsoDateTime(req.body.calcStart) || !isValidIsoDateTime(req.body.calcEnd)) {
		failure(res, HTTP_CODES.BAD_REQUEST);
		return;
	}

	const conn = getConnection();
	try {
		const baseline = new Baseline(
			req.body.meterID,
			req.body.applyStart,
			req.body.applyEnd,
			req.body.calcStart,
			req.body.calcEnd,
			req.body.note);
		await baseline.insert(conn);
		success(res);
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while adding baseline: ${err.message}`, { cause: err }));
	}
});
module.exports = router;
