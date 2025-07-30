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
		weekName: item.weekName, 
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
 * Route for getting all weeks.
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
 * Route for POST add week.
 */
router.post('/add', adminAuthMiddleware('add week'), async (req, res) => {
	const validWeek= {
		type: 'object',
		maxProperties: 9,
		required: ['weekName', 'sunday','monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
		properties: {
			weekName: {
				type: 'string',
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			sunday: {
				type: 'number'
			},
			monday: {
				type: 'number'
			},
			tuesday: {
				type: 'number'
			},
			wednesday: {
				type: 'number'
			},
			thursday: {
				type: 'number'
			},
			friday: {
				type: 'number'
			},
			saturday: {
				type: 'number'
			}
		}
	};

	const validatorResult = validate(req.body, validWeek);
	if (!validatorResult.valid) {
		log.error(`Got request to insert week with invalid week data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to insert week with invalid week data. Error(s): ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newWeek = new Week(
					undefined,
					req.body.weekName,
					req.body.note,
					req.body.sunday,
					req.body.monday,
					req.body.tuesday,
					req.body.wednesday,
					req.body.thursday,
					req.body.friday,
					req.body.saturday
				);
				await newWeek.insert(t);
			});
			success(res, `Successfully inserted week`);
		} catch (err) {
			log.error(`Error while inserting new week with error(s): ${err}`);
			failure(res, 500, `Error while inserting new week with errors(s): ${err}`);
		}
	}
});

/**
 * Route for POST, edit week.
 */
router.post('/edit', adminAuthMiddleware('edit week'), async (req, res) => {
	const validWeek = {
		type: 'object',
		maxProperties: 10,
		required: ['id', 'weekName', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
		properties: {
			id: {
				type: 'integer', 
				minimum: 0
			},
			weekName: {
				type: 'string',
			},
			note: {
				oneOf: [
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			sunday: {
				type: 'number'
			},
			monday: {
				type: 'number'
			},
			tuesday: {
				type: 'number'
			},
			wednesday: {
				type: 'number'
			},
			thursday: {
				type: 'number'
			},
			friday: {
				type: 'number'
			},
			saturday: {
				type: 'number'
			}
		}
	};

	const validatorResult = validate(req.body, validWeek);
	if (!validatorResult.valid) {
		log.warn(`Got request to edit weeks with invalid week data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to edit weeks with invalid week data, errors: ${validatorResult.errors}`);
	} else {
		const conn = getConnection();
		try {
			const updatedWeek = new Week(
				req.body.id, 
				req.body.weekName,
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
			success(res, `Successfully updated week`);
		} catch (err) {
			log.error(`Error while updating week with error(s): ${err}`);
			failure(res, 500, `Error while updating week with error(s): ${err}`);
		}
	}
});

/**
 * Route for POST, delete week.
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
		log.warn(`Got request to delete weeks with invalid week data, errors: ${validatorResult.errors}`);
		failure(res, 400, `Got request to delete weeks with invalid week data. Error(s): ${validatorResult.errors}`);
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
			log.error(`Error while deleting week with error(s): ${err}`);
			failure(res, 500, `Error while deleting week with errors(s): ${err}`);
		}
	}
});

module.exports = router;