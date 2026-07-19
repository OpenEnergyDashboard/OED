/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Holiday = require('../models/Holiday');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

function formatHolidayForResponse(item) {
	return {
		id: item.id,
		name: item.name,
		startDate: item.startDate,
		location: item.location,
		note: item.note
	};
}

/**
 * Route for getting all holidays.
 *
 * Error response: 500 when the database query fails.
 */
router.get('/', adminAuthMiddleware('get all holidays'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Holiday.getAll(conn);
		res.json(rows.map(formatHolidayForResponse));
	} catch (err) {
		log.error(`Error while performing GET all holidays query: ${err}`);
		res.sendStatus(500);
	}
});

/**
 * Route for getting one holiday by id.
 *
 * Route params:
 * - holidayId: numeric holiday id.
 */
router.get('/:holidayId', adminAuthMiddleware('get holiday by id'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['holidayId'],
		properties: {
			holidayId: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};

	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve a holiday by id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await Holiday.getById(req.params.holidayId, conn);
			res.json(formatHolidayForResponse(row));
		} catch (err) {
			log.error(`Error while performing GET holiday by id query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for adding a new holiday.
 */
router.post('/addHoliday', adminAuthMiddleware('add holiday'), async (req, res) => {
	const validHoliday = {
		type: 'object',
		maxProperties: 4,
		required: ['name', 'startDate', 'location'],
		properties: {
			name: {
				type: 'string',
				minLength: 1
			},
			startDate: {
				type: 'string',
				pattern: '^\\d{4}-\\d{2}-\\d{2}$'
			},
			location: {
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

	const validatorResult = validate(req.body, validHoliday);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a holiday with invalid holiday data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newHoliday = new Holiday(
				undefined,
				req.body.name,
				req.body.startDate,
				req.body.location,
				req.body.note
			);
			await newHoliday.insert(conn);
			res.json(formatHolidayForResponse(newHoliday));
		} catch (err) {
			const errMsg = `Error adding new holiday with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for editing an existing holiday.
 */
router.post('/edit', adminAuthMiddleware('edit holiday'), async (req, res) => {
	const validHoliday = {
		type: 'object',
		maxProperties: 5,
		required: ['id', 'name', 'startDate', 'location'],
		properties: {
			id: {
				type: 'integer',
				minimum: 0
			},
			name: {
				type: 'string',
				minLength: 1
			},
			startDate: {
				type: 'string',
				pattern: '^\\d{4}-\\d{2}-\\d{2}$'
			},
			location: {
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

	const validatorResult = validate(req.body, validHoliday);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a holiday with invalid holiday data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await Holiday.updateHoliday(
				req.body.id,
				req.body.name,
				req.body.startDate,
				req.body.location,
				req.body.note,
				conn
			);
			success(res, 'Successfully edited holiday');
		} catch (err) {
			const errMsg = `Error while editing a holiday with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for deleting a holiday by id.
 */
router.post('/delete', adminAuthMiddleware('delete holiday'), async (req, res) => {
	const validHoliday = {
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

	const validatorResult = validate(req.body, validHoliday);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a holiday with invalid holiday data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await Holiday.deleteHoliday(req.body.id, conn);
			success(res, 'Successfully deleted holiday');
		} catch (err) {
			const errMsg = `Error while deleting a holiday with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;
