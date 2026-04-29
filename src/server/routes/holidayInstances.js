/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const HolidayInstance = require('../models/HolidayInstance');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

/**
 * Formats a holiday instance for response
 * @param {Object} item - The holiday instance to format
 * @returns {Object} The formatted holiday instance
 */
function formatHolidayInstanceForResponse(item) {
	return {
		id: item.id,
		name: item.name,
		holidayId: item.holidayId,
		dayPatternId: item.dayPatternId,
		note: item.note
	};
}

/**
 * Formats a holiday instance with details for response
 * @param {Object} item - The holiday instance to format
 * @returns {Object} The formatted holiday instance with details
 */
function formatHolidayInstanceDetailsForResponse(item) {
	return {
		id: item.id,
		name: item.name,
		note: item.note,
		holidayId: item.holiday_id,
		dayPatternId: item.day_pattern_id,
		holidayName: item.holiday_name,
		startDate: item.start_date,
		location: item.location,
		dayPatternName: item.day_pattern_name
	};
}

/**
 * Route for getting all holiday instances ordered by name
 */
router.get('/', adminAuthMiddleware('get all holiday instances'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await HolidayInstance.getAll(conn);
		res.json(rows.map(formatHolidayInstanceForResponse));
	} catch (err) {
		log.error(`Error while performing GET all holiday instances query: ${err}`);
		res.sendStatus(500);
	}
});

/**
 * Route for getting all holiday instances with joined holiday and day pattern details
 */
router.get('/withDetails', adminAuthMiddleware('get holiday instances with details'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await HolidayInstance.getWithDetails(conn);
		res.json(rows.map(formatHolidayInstanceDetailsForResponse));
	} catch (err) {
		log.error(`Error while performing GET holiday instances with details query: ${err}`);
		res.sendStatus(500);
	}
});

/**
 * Route for getting holiday instances for a given holiday id
 *
 * Route params:
 * - holidayId: numeric holiday id
 */
router.get('/holiday/:holidayId', adminAuthMiddleware('get holiday instances by holiday id'), async (req, res) => {
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
		const errMsg = `Got request to retrieve holiday instances by holiday id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const rows = await HolidayInstance.getByHolidayId(req.params.holidayId, conn);
			res.json(rows.map(formatHolidayInstanceForResponse));
		} catch (err) {
			log.error(`Error while performing GET holiday instances by holiday id query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for getting one holiday instance by id
 *
 * Route params:
 * - holidayInstanceId: numeric holiday instance id
 */
router.get('/:holidayInstanceId', adminAuthMiddleware('get holiday instance by id'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['holidayInstanceId'],
		properties: {
			holidayInstanceId: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};

	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve a holiday instance by id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await HolidayInstance.getById(req.params.holidayInstanceId, conn);
			res.json(formatHolidayInstanceForResponse(row));
		} catch (err) {
			log.error(`Error while performing GET holiday instance by id query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for adding a new holiday instance
 */
router.post('/addHolidayInstance', adminAuthMiddleware('add holiday instance'), async (req, res) => {
	const validHolidayInstance = {
		type: 'object',
		maxProperties: 4,
		required: ['name', 'holidayId', 'dayPatternId'],
		properties: {
			name: {
				type: 'string',
				minLength: 1
			},
			holidayId: {
				type: 'integer',
				minimum: 0
			},
			dayPatternId: {
				type: 'integer',
				minimum: 0
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validHolidayInstance);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a holiday instance with invalid holiday instance data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newHolidayInstance = new HolidayInstance(
				undefined,
				req.body.name,
				req.body.holidayId,
				req.body.dayPatternId,
				req.body.note
			);
			await newHolidayInstance.insert(conn);
			res.json(formatHolidayInstanceForResponse(newHolidayInstance));
		} catch (err) {
			const errMsg = `Error adding new holiday instance with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for editing an existing holiday instance
 *
 * Request body:
 * - id: numeric holiday instance id
 */
router.post('/edit', adminAuthMiddleware('edit holiday instance'), async (req, res) => {
	const validHolidayInstance = {
		type: 'object',
		maxProperties: 5,
		required: ['id', 'name', 'holidayId', 'dayPatternId'],
		properties: {
			id: {
				type: 'integer',
				minimum: 0
			},
			name: {
				type: 'string',
				minLength: 1
			},
			holidayId: {
				type: 'integer',
				minimum: 0
			},
			dayPatternId: {
				type: 'integer',
				minimum: 0
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			}
		}
	};

	const validatorResult = validate(req.body, validHolidayInstance);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a holiday instance with invalid holiday instance data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await HolidayInstance.updateHoliday(
				req.body.id,
				req.body.name,
				req.body.holidayId,
				req.body.dayPatternId,
				req.body.note,
				conn
			);
			success(res, 'Successfully edited holiday instance');
		} catch (err) {
			const errMsg = `Error while editing a holiday instance with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for deleting a holiday instance by id
 *
 * Request body:
 * - id: numeric holiday instance id
 */
router.post('/delete', adminAuthMiddleware('delete holiday instance'), async (req, res) => {
	const validHolidayInstance = {
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

	const validatorResult = validate(req.body, validHolidayInstance);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a holiday instance with invalid holiday instance data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await HolidayInstance.deleteHolidayInstance(req.body.id, conn);
			success(res, 'Successfully deleted holiday instance');
		} catch (err) {
			const errMsg = `Error while deleting a holiday instance with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;
