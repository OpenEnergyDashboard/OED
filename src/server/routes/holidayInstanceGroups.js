/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const HolidayInstanceGroup = require('../models/HolidayInstanceGroup');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

function formatHolidayInstanceGroupForResponse(item) {
	return {
		id: item.id,
		name: item.name,
		note: item.note
	};
}

/**
 * Route for getting all holiday instance groups.
 *
 * Response: 200 OK with an array of holiday instance groups
 */
router.get('/', adminAuthMiddleware('get all holiday instance groups'), async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await HolidayInstanceGroup.getAll(conn);
		res.json(rows.map(formatHolidayInstanceGroupForResponse));
	} catch (err) {
		log.error(`Error while performing GET all holiday instance groups query: ${err}`);
		res.sendStatus(500);
	}
});

/**
 * Route for getting one holiday instance group by id.
 *
 * Route params:
 * - id: numeric holiday instance group id
 */
router.get('/:id', adminAuthMiddleware('get holiday instance group by id'), async (req, res) => {
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
		const errMsg = `Got request to retrieve a holiday instance group by id with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const row = await HolidayInstanceGroup.getById(req.params.id, conn);
			res.json(formatHolidayInstanceGroupForResponse(row));
		} catch (err) {
			log.error(`Error while performing GET holiday instance group by id query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for adding a new holiday instance group.
 *
 * Request body:
 * - name: non-empty holiday instance group name
 * - note: optional string or null notes for the group
 */
router.post('/addHolidayInstanceGroup', adminAuthMiddleware('add holiday instance group'), async (req, res) => {
	const validHolidayInstanceGroup = {
		type: 'object',
		maxProperties: 2,
		required: ['name'],
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
			}
		}
	};

	const validatorResult = validate(req.body, validHolidayInstanceGroup);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a holiday instance group with invalid holiday instance group data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newHolidayInstanceGroup = new HolidayInstanceGroup(
				undefined,
				req.body.name,
				req.body.note
			);
			await newHolidayInstanceGroup.insert(conn);
			res.json(formatHolidayInstanceGroupForResponse(newHolidayInstanceGroup));
		} catch (err) {
			const errMsg = `Error adding new holiday instance group with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for editing an existing holiday instance group.
 *
 * Request body:
 * - id: holiday instance group id to update
 * - name: non-empty replacement name
 * - note: optional string or null replacement notes
 */
router.post('/edit', adminAuthMiddleware('edit holiday instance group'), async (req, res) => {
	const validHolidayInstanceGroup = {
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

	const validatorResult = validate(req.body, validHolidayInstanceGroup);
	if (!validatorResult.valid) {
		const errMsg = `Got request to edit a holiday instance group with invalid holiday instance group data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await HolidayInstanceGroup.updateHolidayInstanceGroup(
				req.body.id,
				req.body.name,
				req.body.note,
				conn
			);
			success(res, 'Successfully edited holiday instance group');
		} catch (err) {
			const errMsg = `Error while editing a holiday instance group with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for deleting a holiday instance group.
 *
 * Request body:
 * - id: holiday instance group id to delete
 */
router.post('/delete', adminAuthMiddleware('delete holiday instance group'), async (req, res) => {
	const validHolidayInstanceGroup = {
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

	const validatorResult = validate(req.body, validHolidayInstanceGroup);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a holiday instance group with invalid holiday instance group data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await HolidayInstanceGroup.deleteHolidayInstanceGroup(req.body.id, conn);
			success(res, 'Successfully deleted holiday instance group');
		} catch (err) {
			const errMsg = `Error while deleting a holiday instance group with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;
