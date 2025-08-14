/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Week = require('../models/Week');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

function formatWeekForResponse(item) {
	return {
		id: item.id, 
		name: item.name, 
		note: item.note,
		sunday: item.sunday,
		monday: item.monday,
		tuesday: item.tuesday,
		wednesday: item.wednesday,
		thursday: item.thursday,
		friday: item.friday,
		saturday: item.saturday
	};
}

/**
 * GET all weeks.
 */
router.get('/', adminAuthMiddleware('get all weeks'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Week.getAll(conn);
		res.json(rows.map(formatWeekForResponse));
	} catch (err) {
		log.error(`Error while performing GET weeks details query: ${err}`);
	}
});

/**
 * GET week by id
 */
router.get('/:id', adminAuthMiddleware('get week by id'), async(req, res) => {
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

	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve a week by id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await Week.getById(req.params.id, conn);
			res.json(formatWeekForResponse(row));
		} catch (err) {
			log.error(`Error while performing GET week by id: ${err}`);
		}
	}
});

/**
 * POST add week.
 * @param {string} name The name for the week.
 * @param {string} note The notes for the week.
 * @param {integer} sunday The id for the day pattern used for sunday.
 * @param {integer} monday The id for the day pattern used for monday.
 * @param {integer} tuesday The id for the day pattern used for tuesday.
 * @param {integer} wednesday The id for the day pattern used for wednesday.
 * @param {integer} thursday The id for the day pattern used for thursday.
 * @param {integer} friday The id for the day pattern used for friday.
 * @param {integer} saturday The id for the day pattern used for saturday.
 */
router.post('/addWeek', adminAuthMiddleware('add week'), async (req, res) => {
	const validWeek= {
		type: 'object',
		maxProperties: 9,
		required: ['name', 'sunday','monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
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
			sunday: {
				type: 'integer',
				minimum: 0
			},
			monday: {
				type: 'integer',
				minimum: 0
			},
			tuesday: {
				type: 'integer',
				minimum: 0
			},
			wednesday: {
				type: 'integer',
				minimum: 0
			},
			thursday: {
				type: 'integer',
				minimum: 0
			},
			friday: {
				type: 'integer',
				minimum: 0
			},
			saturday: {
				type: 'integer',
				minimum: 0
			}
		}
	};

	const validatorResult = validate(req.body, validWeek);
	if (!validatorResult.valid) {
		const errMsg = `Got request to insert a week with invalid week data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newWeek = new Week(
				undefined,
				req.body.name,
				req.body.note,
				req.body.sunday,
				req.body.monday,
				req.body.tuesday,
				req.body.wednesday,
				req.body.thursday,
				req.body.friday,
				req.body.saturday
			);
			await newWeek.insert(conn);
			success(res, `Successfully inserted week`);
		} catch (err) {
			const errMsg = `Error while inserting a new week with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST edit week.
 * @param {integer} id The id for the week to be edited.
 * @param {string} name The new name for the week.
 * @param {string} note The new notes for the week.
 * @param {integer} sunday The new id for the day pattern used for sunday.
 * @param {integer} monday The new id for the day pattern used for monday.
 * @param {integer} tuesday The new id for the day pattern used for tuesday.
 * @param {integer} wednesday The new id for the day pattern used for wednesday.
 * @param {integer} thursday The new id for the day pattern used for thursday.
 * @param {integer} friday The new id for the day pattern used for friday.
 * @param {integer} saturday The new id for the day pattern used for saturday.
 */
router.post('/edit', adminAuthMiddleware('edit week'), async (req, res) => {
	const validWeek = {
		type: 'object',
		maxProperties: 10,
		required: ['id', 'name', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
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
			},
			sunday: {
				type: 'integer',
				minimum: 0
				
			},
			monday: {
				type: 'integer',
				minimum: 0
			},
			tuesday: {
				type: 'integer',
				minimum: 0
			},
			wednesday: {
				type: 'integer',
				minimum: 0
			},
			thursday: {
				type: 'integer',
				minimum: 0
			},
			friday: {
				type: 'integer',
				minimum: 0
			},
			saturday: {
				type: 'integer',
				minimum: 0
			}
		}
	};

	const validatorResult = validate(req.body, validWeek);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a week with invalid week data, error(s): ${validatorResult.errors}`
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const updatedWeek = new Week(
				req.body.id, 
				req.body.name,
				req.body.note,
				req.body.sunday,
				req.body.monday,
				req.body.tuesday,
				req.body.wednesday,
				req.body.thursday,
				req.body.friday,
				req.body.saturday
			);
			await updatedWeek.update(conn);
			success(res, `Successfully edited week`);
		} catch (err) {
			const errMsg = `Error while editing a week with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * POST delete week.
 * @param {integer} id The id of the week to be deleted.
 */
router.post('/delete', adminAuthMiddleware('delete week'), async (req, res) => {
	const validWeek = {
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

	// Ensure week object is valid
	const validatorResult = validate(req.body, validWeek);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a week with invalid week data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			// Don't worry about checking if the week already exists
			// Just try to delete it to save the extra database call, since the database will return an error anyway if the row does not exist
			await Week.delete(
				req.body.id,
				conn
			);
			success(res, 'Successfully deleted week');
		} catch (err) {
			const errMsg = `Error while deleting week with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;