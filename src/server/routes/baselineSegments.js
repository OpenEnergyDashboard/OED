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
const mockBaselines = require("../data/mockBaselines") //TODO: Get rid of this, make routes query data from db

router.get("/getAll", (req, res) => {
    res.json(mockBaselines);
});



/**
 * GET all baseline segments by meter ID.
 * @param {int} meterId The current meter's id.
 */
router.get("/get", async (req, res) => {
    const { meterId } = req.params;
    try {
        const meterId = req.body.meterId;
        const conn = getConnection();
        try {
            const rows = await BaselineSegment.getAllByMeterId(meterId, conn);
            res.json(rows.map(formatBaselineSegmentsForResponse));
        } catch (err) {
            log.error(`Error while performing GET conversions details query: ${err}`);
        }
        res.json(segments);
    } catch (err) {
        log.error(`Request sent with no or an invalid meterId`);
    }
});

/**
 * POST add baseline segment.
 * @param {int} meter The current meter's id.
 * @param {number} baselineValue The slope for the baseline segment.
 * @param {string} startTime The start time of the baseline segment.
 * @param {string} endTime The end time of the baseline segment.
 * @param {string | null} calcStart The calculation start time of the baseline segment.
 * @param {string | null} calcEnd The calculation end time of the baseline segment.
 * @param {string} note Notes added by the admin for the baseline segment.
 */
router.post('/addBaselineSegment', adminAuthMiddleware('add baseline segment'), async (req, res) => {
	const validBaselineSegment = {
		type: 'object',
		maxProperties: 8,
		required: ['meterId', 'baselineValue', 'startTime', 'endTime'],
		properties: {
			meterId: {
				type: 'integer',
				minimum: 0
			},
			baselineValue: {
				type: 'number'
			},
			startTime: {
				type: 'string'
			},
			endTime: {
				type: 'string'
			},
            calcStart: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
            calcEnd: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			},
			note: {
				oneOf: [
					{type: 'string'},
					{type: 'null'}
				]
			}
		}
	};
	
	const validatorResult = validate(req.body, validBaselineSegment);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a baseline segment with invalid baseline segment data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newBaselineSegment = new BaselineSegment(
				req.body.meterId, 
				req.body.baselineValue, 
				momentToIsoOrInfinity(req.body.startTime),
				momentToIsoOrInfinity(req.body.endTime),
                momentToIsoOrInfinity(req.body.calsStart),
				momentToIsoOrInfinity(req.body.calcEnd),
				req.body.note
			);
			await newBaselineSegment.insert(conn);
			success(res, `Successfully added baseline segment`);
		} catch (err) {
			const errMsg = `Error adding baseline segment with error(s): ${err}`
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
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
/**
 * POST split a segment in two, the earlier segment uses the new baselineValue/note.
 * @param {int} meterId The meter's id.
 * @param {string} startTime The start time of the baseline segment.
 * @param {string} endTime The end time of the baseline segment.
 * @param {number} newBaselineValue The baseline value for the new baseline segment.
 * @param {string} newNote Notes added by the admin for the new baseline segment.
 * @param {string} splitTime The time to split the segment at.
 */
router.post('/splitEarlier', adminAuthMiddleware('split earlier baseline segment'), async (req, res) => {
    const validBaselineSegment = {
        type: 'object',
        maxProperties: 9,
        required: ['meterId', 'startTime', 'endTime', 'newBaselineValue', 'newNote', 'splitTime'],
        properties: {
            meterId: {
                type: 'integer',
                minimum: 0
            },
            startTime: {
                type: 'string'
            },
            endTime: {
                type: 'string'
            },
            newBaselineValue: {
                type: 'number'
            },
            newNote: {
                oneOf: [
                    { type: 'string' },
                    { type: 'null' }
                ]
            },
            splitTime: {
                type: 'string'
            }
        }
    };

    const validatorResult = validate(req.body, validBaselineSegment);
    if (!validatorResult.valid) {
        const errMsg = `Got request to split a baseline segment earlier with invalid baseline segment data, error(s): ${validatorResult.errors}`;
        log.warn(errMsg);
        failure(res, 400, errMsg);
    } else {
        const conn = getConnection();
        try {
            await BaselineSegment.splitEarlier(
                req.body.meterId,
                req.body.newBaselineValue,
                req.body.newNote,
                momentToIsoOrInfinity(req.body.startTime),
                momentToIsoOrInfinity(req.body.endTime),
                momentToIsoOrInfinity(req.body.splitTime),
                conn
            );
            success(res, `Successfully split baseline segment earlier`);
        } catch (err) {
            const errMsg = `Error splitting baseline segment earlier with error(s): ${err}`
            log.error(errMsg);
            failure(res, 500, errMsg);
        }
    }
});

/**
 * POST split a segment in two, the later segment uses the new baselineValue/note.
 * @param {int} meterId The meter's id.
 * @param {string} startTime The start time of the baseline segment.
 * @param {string} endTime The end time of the baseline segment.
 * @param {number} newBaselineValue The baseline value for the new baseline segment.
 * @param {string} newNote Notes added by the admin for the new baseline segment.
 * @param {string} splitTime The time to split the segment at.
*/
router.post('/splitLater', adminAuthMiddleware('split later baseline segment'), async (req, res) => {
    const validBaselineSegment = {
        type: 'object',
        maxProperties: 9,
        required: ['meterId', 'startTime', 'endTime', 'newBaselineValue', 'newNote', 'splitTime'],
        properties: {
            meterId: {
                type: 'integer',
                minimum: 0
            },
            startTime: {
                type: 'string'
            },
            endTime: {
                type: 'string'
            },
            newBaselineValue: {
                type: 'number'
            },
            newNote: {
                oneOf: [
                    { type: 'string' },
                    { type: 'null' }
                ]
            },
            splitTime: {
                type: 'string'
            }
        }
    };

    const validatorResult = validate(req.body, validBaselineSegment);
    if (!validatorResult.valid) {
        const errMsg = `Got request to split a baseline segment later with invalid baseline segment data, error(s): ${validatorResult.errors}`;
        log.warn(errMsg);
        failure(res, 400, errMsg);
    } else {
        const conn = getConnection();
        try {
            await BaselineSegment.splitLater(
                req.body.meterId,
                req.body.newBaselineValue,
                req.body.newNote,
                momentToIsoOrInfinity(req.body.startTime),
                momentToIsoOrInfinity(req.body.endTime),
                momentToIsoOrInfinity(req.body.splitTime),
                conn
            );
            success(res, `Successfully split baseline segment later`);
        } catch (err) {
            const errMsg = `Error splitting baseline segment later with error(s): ${err}`
            log.error(errMsg);
            failure(res, 500, errMsg);
        }
    }
});