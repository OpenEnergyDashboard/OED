/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

/**
 * GET all holiday instance groups.
 */
router.get('/', adminAuthMiddleware('get all holiday instance groups'), async (req, res) => {
	try {
		res.json([]);
	} catch (err) {
		log.error(`Error while performing GET all holiday instance groups query: ${err}`);
		res.sendStatus(500);
	}
});

/**
 * GET holiday instance group by id.
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
		try {
			res.json({});
		} catch (err) {
			log.error(`Error while performing GET holiday instance group by id query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * POST add holiday instance group.
 * @param {string} name The name for the holiday instance group.
 * @param {string} note Notes for the holiday instance group.
 */
router.post('/addHolidayInstanceGroup', adminAuthMiddleware('add holiday instance group'), async (req, res) => {
	try {
		success(res, 'Successfully added holiday instance group');
	} catch (err) {
		const errMsg = `Error adding new holiday instance group with error(s): ${err}`;
		log.error(errMsg);
		failure(res, 500, errMsg);
	}
});

/**
 * POST edit holiday instance group.
 * @param {integer} id The id for the holiday instance group.
 * @param {string} name The new name for the holiday instance group.
 * @param {string} note The new notes for the holiday instance group.
 */
router.post('/edit', adminAuthMiddleware('edit holiday instance group'), async (req, res) => {
	try {
		success(res, 'Successfully edited holiday instance group');
	} catch (err) {
		const errMsg = `Error while editing a holiday instance group with error(s): ${err}`;
		log.error(errMsg);
		failure(res, 500, errMsg);
	}
});

/**
 * POST delete holiday instance group.
 * @param {integer} id The id for the holiday instance group to be deleted.
 */
router.post('/delete', adminAuthMiddleware('delete holiday instance group'), async (req, res) => {
	try {
		success(res, 'Successfully deleted holiday instance group');
	} catch (err) {
		const errMsg = `Error while deleting a holiday instance group with error(s): ${err}`;
		log.error(errMsg);
		failure(res, 500, errMsg);
	}
});

module.exports = router;
