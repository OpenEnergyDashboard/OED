/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { getConnection } = require('../db');
const express = require('express');
const BaselineSegment = require('../models/BaselineSegment');
const log = require('../log');
const { adminAuthMiddleware } = require('./authenticator');
const router = express.Router();
const mockBaselines = require("../data/mockBaselines")

router.get("/allSegments", (req, res) => {
	res.json(mockBaselines);
});
router.get("/segment/:meterId", (req, res) => {
	const { meterId } = req.params;
	const segments = mockBaselines.filter(s => s.meterId == meterId);
	res.json(segments);
});
router.get("/segment/:meterId", (req, res) => {
	const { meterId } = req.params;
	const segments = mockBaselines.filter(s => s.meterId == meterId);
	res.json(segments);
});
router.post('/edit', adminAuthMiddleware('edit baseline segments'), async (req, res) => {
    const validBaselineSegment = {
		type: 'object',
		required: ['meterId', 'baselineValue', 'startTime', 'endTime', 'calcStart', 'calcEnd', 'note'],
		properties: {
			meterId: { type: 'number' },
			baselineValue: { 
                type: 'number',
                minimum: 0 
            },
            startTime: { type: 'number' },
	        endTime: { type: 'number' },
            calcStart: {
                oneOf: [
					{ type: 'number' },
					{ type: 'null' }
				]
            },
            calcEnd: {
                oneOf: [
					{ type: 'number' },
					{ type: 'null' }
				]
            },
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};
    const validatorResult = validate(req.body, validBaselineSegment);
    if (!validatorResult.valid) {
        log.warn(`Got request to edit baselines with invalid baseline segment data, errors: ${validatorResult.errors}`);
        failure(res, 400, `Got request to edit baselines with invalid baseline segment data, errors: ${validatorResult.errors}`);
    } else {
        const conn = getConnection();
        try {
            const updatedBaselineSegment = new BaselineSegment(req.body.meterId, req.body.isActive, req.body.note);
            await updatedBaseline.update(conn);
        } catch (err) {
            log.error(`Error while editing conversion with error(s): ${err}`);
            failure(res, 500, `Error while editing conversion with error(s): ${err}`);
        }
        success(res);
    }
});