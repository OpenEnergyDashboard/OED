/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const ConversionSegment = require('../models/ConversionSegment');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;

const router = express.Router();
const validConversionSegment = {
    type: 'object',
    maxProperties: 8,
    required: ['sourceId', 'destinationId'],
    properties: {
        sourceId: {
            type: 'number',
            // Do not allow negatives for now
            minimum: 0
        },
        destinationId: {
            type: 'number',
            // Do not allow negatives for now
            minimum: 0
        },
        weekPatternsId: {
            type: 'number',
            minimum: 0
        },
        slope: {
            type: 'number'
        },
        intercept: {
            type: 'number'
        },
        startTime: {
            type: 'string',
            format: 'date-time'
        },
        endTime: {
            type: 'string',
            format: 'date-time'
        },
        note: {
            oneOf: [
                {type: 'string'},
                {type: 'null'}
            ]
        }
    }
};

function formatConversionSegmentForResponse(item) {
	return {
		sourceId: item.sourceId, 
        destinationId: item.destinationId, 
        weekPatternsId: item.weekPatternsId, 
        slope: item.slope, 
        intercept: item.intercept, 
        startTime: item.startTime, 
        endTime: item.endTime, 
        note: item.note
	};
}

/**
 * Route for getting all conversion segments.
 */
router.get('/', async (req, res) => {
    const conn = getConnection();
    try {
        const rows = await ConversionSegment.getAll(conn);
        res.json(rows.map(formatConversionSegmentForResponse));
    } catch (err) {
        log.error(`Error while performing GET conversion segments details query: ${err}`);
    }
});

/**
 * GET information for a specific conversion segment by source and destination
 * @param {int} sourceId
 * @param {int} destinationId
 */
router.get('/:sourceId/:destinationId', async (req, res) => {
    const validParams = {
        type: 'object',
        maxProperties: 2,
        required: ['sourceId', 'destinationId'],
        properties: {
			sourceId: { 
                type: 'string', 
                pattern: '^\\d+$' 
            },
			destinationId: { 
                type: 'string', 
                pattern: '^\\d+$' 
            }
		}
	};

    const validatorResult = validate(req.params, validParams);

    if (!validatorResult.valid) {
		log.warn(`Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
		failure(res, 400, `Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const rows = await ConversionSegment.getBySourceDestination(
                req.params.sourceId, 
                req.params.destinationId, 
                conn
            );
			res.json(rows);
		} catch (err) {
			log.error(`Error while preforming GET on conversion segment : ${err}`, err);
			res.sendStatus(500);
		}
	}
});

/**
 * GET information for a specific conversion segment by source, destination, and start time
 * @param {int} sourceId
 * @param {int} destinationId
 * @param {time} startTime
 */
router.get('/:sourceId/:destinationId/:startTime', async (req, res) => {
    const validParams = {
        type: 'object',
        maxProperties: 3,
        required: ['sourceId', 'destinationId', 'startTime'],
        properties: {
			sourceId: { 
                type: 'string', 
                pattern: '^\\d+$' 
            },
			destinationId: { 
                type: 'string', 
                pattern: '^\\d+$' 
            },
			startTime: { 
                type: 'string', 
                format: 'date-time' 
            }
		}
	};

    const validatorResult = validate(req.params, validParams);

    if (!validatorResult.valid) {
		log.warn(`Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
		failure(res, 400, `Invalid route parameters for conversion segment, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const rows = await ConversionSegment.getBySourceDestinationStart(
                req.params.sourceId, 
                req.params.destinationId, 
                req.params.startTime, 
                conn
            );
			res.json(rows);
		} catch (err) {
			log.error(`Error while preforming GET on conversion segment : ${err}`, err);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for POST, edit conversion segment.
 */
router.post('/edit', async (req, res) => {
    const validatorResult = validate(req.body, validConversionSegment);
    if (!validatorResult.valid) {
		log.warn(`Got request to edit conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const updatedConversionSegment = new ConversionSegment(
                req.body.sourceId, 
                req.body.destinationId, 
                req.body.weekPatternsId, 
                req.body.slope, 
                req.body.intercept, 
                req.body.startTime, 
                req.body.endTime, 
                req.body.note
            );
			await updatedConversionSegment.update(conn);
		} catch (err) {
			log.error(`Error while editing conversion segment with error(s): ${err}`);
			failure(res, 500, `Error while editing conversion segment with error(s): ${err}`);
		}
		success(res);
	}
});

/**
 * Route for POST add conversion segment.
 */
router.post('/add', async (req, res) => {
    const validatorResult = validate(req.body, validConversionSegment);
    if (!validatorResult.valid) {
		log.warn(`Got request to add conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to add conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
	} else {
        const conn = getConnection();
        try {
            await conn.tx(async t => {
                const newConversionSegment = new ConversionSegment(
                    req.body.sourceId, 
                    req.body.destinationId, 
                    req.body.weekPatternsId, 
                    req.body.slope, 
                    req.body.intercept, 
                    req.body.startTime, 
                    req.body.endTime, 
                    req.body.note
                );
                await newConversionSegment.insert(t);
            });
            res.sendStatus(200);
        } catch (err) {
			log.error(`Error while inserting new conversion segment with error(s): ${err}`);
			failure(res, 500, `Error while inserting new conversion segment with errors(s): ${err}`);
		}
    }
});

/**
 * Route for POST, delete conversion segment
 */
router.post('/delete', async (req, res) => {
    // Ensure conversion segment object is valid
	const validatorResult = validate(req.body, validConversionSegment);
	if (!validatorResult.valid) {
		log.warn(`Got request to delete conversion segments with invalid conversion segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete conversion segments with invalid conversion segment data. Error(s): ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the conversion segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await ConversionSegment.delete(
                req.body.sourceId, 
                req.body.destinationId, 
                req.body.startTime,
                conn);
		} catch (err) {
			log.error(`Error while deleting conversion segment with error(s): ${err}`);
			failure(res, 500, `Error while deleting conversion segment with errors(s): ${err}`);
		}
		success(res, 'Successfully deleted conversion segment');
	}
});


module.exports = router;