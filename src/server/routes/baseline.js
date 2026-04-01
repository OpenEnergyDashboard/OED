/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { getConnection } = require('../db');
const express = require('express');
const Baseline = require('../models/Baseline');
const log = require('../log');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');
const { STRING_GENERAL_MAX_LENGTH } = require('../util/validationConstants');
const router = express.Router();
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rawBaselines = await Baseline.getAllBaselines(conn);
		res.json(rawBaselines);
	} catch (err) {
		res.sendStatus(400);
		log(`Error while getting all baselines: ${err}`, 'error');
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
		res.sendStatus(400);
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
		res.sendStatus(200);
	} catch (err) {
		res.sendStatus(400);
		log(`Error while adding baseline: ${err}`, 'error');
	}
});
module.exports = router;
