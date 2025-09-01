/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { getConnection } = require('../db');
const express = require('express');
const Baseline = require('../models/Baseline');
const log = require('../log');
const { adminAuthMiddleware } = require('./authenticator');
const router = express.Router();
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rawBaselines = await Baseline.getAllBaselines(conn);
		res.json(rawBaselines);
	} catch (err) {
		log(`Error while getting all baselines: ${err}`, 'error');
	}
});
router.post('/new', async (req, res) => {
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
		res.sendStatus(500);
		log(`Error while adding baseline: ${err}`, 'error');
	}
});
router.post('/edit', adminAuthMiddleware('edit baselines'), async (req, res) => {
	const validConversion = {
		type: 'object',
		required: ['baselineValue', 'isActive'],
		properties: {
			baselineValue: {
				type: 'number',
				// Do not allow negatives for now
				minimum: 0
			},
			isActive: {
				type: 'boolean'
			}
		}
	};

	// not edited
	const validatorResult = validate(req.body, validConversion);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit conversions with invalid conversion data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit conversions with invalid conversion data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const updatedConversion = new Conversion(req.body.sourceId, req.body.destinationId, req.body.bidirectional,
				req.body.slope, req.body.intercept, req.body.note);
			await updatedConversion.update(conn);
		} catch (err) {
			log.error(`Error while editing conversion with error(s): ${err}`);
			failure(res, 500, `Error while editing conversion with error(s): ${err}`);
		}
		success(res);
	}
});

module.exports = router;
