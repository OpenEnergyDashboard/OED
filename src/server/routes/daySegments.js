/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const DaySegment = require('../models/DaySegment');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;

const router = express.Router();

function formatDaySegmentForResponse(item) {
	return {
		id: item.id, 
        dayId: item.dayId,
        startHour: item.startHour,
        endHour: item.endHour,
        slope: item.slope,
        intercept: item.intercept,
        note: item.note, 
	};
}

/**
 * Route for getting all day segments.
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await DaySegment.getAll(conn);
		res.json(rows.map(formatDaySegmentForResponse));
	} catch (err) {
		log.error(`Error while performing GET day segment details query: ${err}`);
	}
});

/**
 * Route for getting a day segment by id
 */
router.get('/:id', async(req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		return res.status(400).json({error: 'Invalid id'});
	} else {
		const conn = getConnection();
		try {
			const rows = await DaySegment.getById(req.params.id, conn);
			res.json(rows);
		} catch (err) {
			log.error(`Error while performing GET day segment by id: ${err}`);
		}
	}
});

/**
 * Route for getting all day segments with the same day id
 */
router.get('/dayId/:dayId', async(req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['dayId'],
		properties: {
			dayId: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		return res.status(400).json({error: 'Invalid dayId'});
	} else {
		const conn = getConnection();
		try {
			const rows = await DaySegment.getByDayId(req.params.dayId, conn);
			res.json(rows.map(formatDaySegmentForResponse));
		} catch (err) {
			log.error(`Error while performing GET day segments by dayId: ${err}`);
		}
	}
});

/**
 * Route for POST, edit day segment.
 */
router.post('/edit', async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 7,
		required: ['id'],
		properties: {
			id: {
				type: 'number'
			},
			dayId: {
				type: 'number',
                minimum: 0
			},
            startHour: {
                type: 'number',
				minimum: 0,
				maximum: 23
            },
            endHour: {
                type: 'number',
				minimum: 1,
				maximum: 24
            },
            slope: {
                type: 'number'
            },
            intercept: {
                type: 'number'
            },
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit day segments with invalid day segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit day segments with invalid day segment data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const updatedDaySegment = new DaySegment(
                req.body.id, 
                req.body.dayId,
                req.body.startHour,
                req.body.endHour,
                req.body.slope,
                req.body.intercept, 
                req.body.note
            );
			await updatedDaySegment.update(conn);
		} catch (err) {
			log.error(`Error while editing day segment with error(s): ${err}`);
			failure(res, 500, `Error while editing day segment with error(s): ${err}`);
		}
		success(res);
	}
});

/**
 * Route for POST add day segment.
 */
router.post('/add', async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 6,
		required: ['dayId', 'startHour', 'endHour', 'slope', 'intercept'],
		additionalProperties: false,
		properties: {
			dayId: {
				type: 'number',
                minimum: 0
			},
            startHour: {
                type: 'number',
				minimum: 0,
				maximum: 23
            },
            endHour: {
                type: 'number',
				minimum: 1,
				maximum: 24
            },
            slope: {
                type: 'number'
            },
            intercept: {
                type: 'number'
            },
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		log.error(`Got request to insert day segment with invalid day segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to insert day segment with invalid day segment data. Error(s): ${validatorResult.errors}`);
	} else {

		if (req.body.startHour >= req.body.endHour) {
			return failure(res, 400, `start hour must be less than end hour`);
		} else {
			const conn = getConnection();
			try {
				await conn.tx(async t => {
					const newDaySegment = new DaySegment(
						undefined,
						req.body.dayId,
						req.body.startHour,
						req.body.endHour,
						req.body.slope,
						req.body.intercept,
						req.body.note
					);
					await newDaySegment.insert(t);
				});
				res.sendStatus(200);
			} catch (err) {
				log.error(`Error while inserting new day segment with error(s): ${err}`);
				failure(res, 500, `Error while inserting new day segment with errors(s): ${err}`);
			}
		}
	}
});

/**
 * Route for POST, delete day segment.
 */
router.post('/delete', async (req, res) => {
	const validDaySegment = {
		type: 'object',
		maxProperties: 7,
		required: ['id'],
		properties: {
			id: {
				type: 'number'
			},
			dayId: {
				type: 'number',
                minimum: 0
			},
            startHour: {
                type: 'number',
				minimum: 0,
				maximum: 23
            },
            endHour: {
                type: 'number',
				minimum: 1,
				maximum: 24
            },
            slope: {
                type: 'number'
            },
            intercept: {
                type: 'number'
            },
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	// Ensure day segment object is valid
	const validatorResult = validate(req.body, validDaySegment);
	if (!validatorResult.valid) {
		log.warn(`Got request to delete day segments with invalid day segment data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete day segments with invalid day segment data. Error(s): ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the day segment already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await DaySegment.delete(req.body.id, conn);
		} catch (err) {
			log.error(`Error while deleting day segment with error(s): ${err}`);
			failure(res, 500, `Error while deleting day segment with errors(s): ${err}`);
		}
		success(res, 'Successfully deleted day segment');
	}
});

module.exports = router;