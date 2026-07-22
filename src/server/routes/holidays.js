/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const Holiday = require('../models/Holiday');
const DateHolidays = require('date-holidays');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

const Holidays = DateHolidays.default || DateHolidays;

/**
 * Creates a standard location string for holiday table.
 * Example: US, US-CA, US-CA-LA
 * @param country country code
 * @param state state/provence code
 * @param region regional code
 * @returns standardized location code.
 */
function buildLocationCode(country, state = '', region = ''){
	return [country, state, region].filter(Boolean).join('-');
}

/**
 * Converts the location map from date-holidays into dropdown options.
 * @param {Object.<string, string>} locations Location codes and names.
 * @returns {Array.<{code: string, name: string}>} Sorted location options.
 */
function formatLocationOptions(locations) {
	return Object.entries(locations || {})
		.map(([code, name]) => ({ code, name }))
		.sort((first, second) => first.code.localeCompare(second.code));
}

/**
 * Maps imported Holidays to Holiday object
 * @param item item holiday returned by date-holiday
 * @param country country code
 * @param state state/provence code
 * @param region regional code
 * @returns {Holiday} object ready for the DB.
 */
function mapImportedHoliday(item,country,state='',region=''){
	const name = String(item.name).trim();
	const startDate = String(item.date).slice(0,10);
	const location = buildLocationCode(country,state,region);

	//TODO: may be good to implement some checks here ie date format or if data came back empty
	//TODO: remove comments which start with Rose:
	//Rose: undefined is id, and null is the note.
	return new Holiday(
		undefined,
		name,
		startDate,
		location,
		null
	);
}

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
 * Route for getting holiday countries, states and regions.
 */
router.get('/locations', adminAuthMiddleware('get holiday locations'), async (req, res) => {
	const validQuery = {
		type: 'object',
		properties: {
			country: {
				type: 'string'
			},
			state: {
				type: 'string'
			}
		}
	};

	const validatorResult = validate(req.query, validQuery);

	if (!validatorResult.valid) {
		const errMsg = `Got request for holiday locations with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		try {
			const holidays = new Holidays();
			const country = req.query.country;
			const state = req.query.state;

			const countries = formatLocationOptions(
				holidays.getCountries('en')
			);

			let states = [];
			let regions = [];

			if (country) {
				states = formatLocationOptions(
					holidays.getStates(country, 'en')
				);
			}

			if (country && state) {
				regions = formatLocationOptions(
					holidays.getRegions(country, state, 'en')
				);
			}

			res.json({
				countries,
				states,
				regions
			});
		} catch (err) {
			log.error(`Error while getting holiday locations: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for refreshing holidays for a location and year.
 */
router.post('/refresh', adminAuthMiddleware('refresh holidays'), async (req, res) => {
	const validRequest = {
		type: 'object',
		maxProperties: 4,
		required: ['country', 'year'],
		properties: {
			country: {
				type: 'string',
				minLength: 1
			},
			state: {
				type: 'string'
			},
			region: {
				type: 'string'
			},
			year: {
				type: 'integer'
			}
		}
	};

	const validatorResult = validate(req.body, validRequest);

	if (!validatorResult.valid) {
		const errMsg = `Got request to refresh holidays with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const country = req.body.country;
		const state = req.body.state || '';
		const region = req.body.region || '';
		const year = req.body.year;

		try {
			const dateHolidays = new Holidays(
				country,
				state || undefined,
				region || undefined
			);

			const importedHolidays = dateHolidays
				.getHolidays(year, 'en')
				.map(item => mapImportedHoliday(
					item,
					country,
					state,
					region
				));

			const conn = getConnection();

			await conn.tx(async transaction => {
				for (const holiday of importedHolidays) {
					await holiday.insertOrUpdate(transaction);
				}
			});

			res.json({
				location: buildLocationCode(country, state, region),
				year,
				total: importedHolidays.length
			});
		} catch (err) {
			log.error(`Error while refreshing holidays: ${err}`);
			res.sendStatus(500);
		}
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
