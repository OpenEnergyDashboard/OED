/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Day = require('../models/Day');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

function formatDayForResponse(item) {
	return {
		id: item.id, 
		name: item.name, 
		note: item.note, 
	};
}

/**
 * GET all days.
 */
router.get('/', adminAuthMiddleware('get all days'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Day.getAll(conn);
		res.json(rows.map(formatDayForResponse));
	} catch (err) {
		log.error(`Error while performing GET all days query: ${err}`);
	}
});

/**
 * GET day by id.
 */
router.get('/:dayId', adminAuthMiddleware('get day by id'), async (req, res) => {
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

	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve a day by id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await Day.getById(req.params.dayId, conn);
			res.json(formatDayForResponse(row));
		} catch (err) {
			log.error(`Error while performing GET day by id query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * POST add day and default day segment
 * @param {string} name The name for the day.
 * @param {string} note The notes for the day.
 * @param {number} slope The slope for the default day segment.
 * @param {number} intercept The intercept for the default day segment.
 * @param {string} segmentNote The notes for the default day segment.
 */
router.post('/addDay', adminAuthMiddleware('add day'), async (req, res) => {
	const validDay = {
		type: 'object',
		maxProperties: 5,
		required: ['name', 'slope', 'intercept'],
		properties: {
			name: {
				type: 'string',
				minLength: 1
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			slope: {
				type: 'number'
			},
			intercept: {
				type: 'number'
			},
			segmentNote: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validDay);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a day with invalid day data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newDay = new Day(
				undefined,
				req.body.name,
				req.body.note
			);
			await newDay.insert(
				req.body.slope, 
				req.body.intercept, 
				req.body.segmentNote,
				conn
			);
			success(res, `Successfully added day`);
		} catch (err) {
			const errMsg = `Error adding new day with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST edit day.
 * @param {integer} id The id for the day.
 * @param {string} name The new name for the day.
 * @param {string} note The new notes for the day.
 */
router.post('/edit', adminAuthMiddleware('edit day'), async (req, res) => {
	const validDay = {
		type: 'object',
		maxProperties: 3,
		required: ['id', 'name'],
		properties: {
			id: {
				type: 'integer', 
				minimum: 0
			},
			name: {
				type: 'string',
				minLength: 1
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validDay);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a day with invalid day data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const updatedDay = new Day(req.body.id, req.body.name, req.body.note);
			await updatedDay.update(conn);
			success(res, `Successfully edited day`);
		} catch (err) {
			const errMsg = `Error while editing a day with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete day.
 * @param {integer} id The id for the day to be deleted.
 */
router.post('/delete', adminAuthMiddleware('delete day'), async (req, res) => {
	const validDay = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: {
				type: 'integer', 
				minimum: 0
			}
		}
	};

	// Ensure day object is valid
	const validatorResult = validate(req.body, validDay);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a day with invalid day data, error(s):${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the day already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await Day.delete(req.body.id, conn);
			success(res, 'Successfully deleted day');
		} catch (err) {
			const errMsg = `Error while deleting a day with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;
