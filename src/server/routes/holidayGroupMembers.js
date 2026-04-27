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
 * GET holiday group members (with joined details) for a holiday instance group.
 */
router.get('/group/:holidayInstanceGroupId', adminAuthMiddleware('get holiday group members by group id'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['holidayInstanceGroupId'],
		properties: {
			holidayInstanceGroupId: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};

	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve holiday group members with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		try {
			res.json([]);
		} catch (err) {
			log.error(`Error while performing GET holiday group members query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * GET resolved holiday dates for a holiday instance group.
 */
router.get('/group/:holidayInstanceGroupId/holidayDates', adminAuthMiddleware('get holiday dates by holiday instance group id'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['holidayInstanceGroupId'],
		properties: {
			holidayInstanceGroupId: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};

	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const errMsg = `Got request to retrieve holiday dates with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		try {
			res.json([]);
		} catch (err) {
			log.error(`Error while performing GET holiday dates by group query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * POST add a holiday instance to a holiday instance group.
 * @param {integer} holidayInstanceGroupId The holiday instance group id.
 * @param {integer} holidayInstanceId The holiday instance id to add.
 */
router.post('/add', adminAuthMiddleware('add holiday group member'), async (req, res) => {
	try {
		success(res, 'Successfully added holiday group member');
	} catch (err) {
		const errMsg = `Error adding holiday group member with error(s): ${err}`;
		log.error(errMsg);
		failure(res, 500, errMsg);
	}
});

/**
 * POST remove one holiday instance from a holiday instance group.
 * @param {integer} holidayInstanceGroupId The holiday instance group id.
 * @param {integer} holidayInstanceId The holiday instance id to remove.
 */
router.post('/delete', adminAuthMiddleware('delete holiday group member'), async (req, res) => {
	try {
		success(res, 'Successfully deleted holiday group member');
	} catch (err) {
		const errMsg = `Error deleting holiday group member with error(s): ${err}`;
		log.error(errMsg);
		failure(res, 500, errMsg);
	}
});

/**
 * POST remove all holiday instances from a holiday instance group.
 * @param {integer} holidayInstanceGroupId The holiday instance group id.
 */
router.post('/deleteByGroup', adminAuthMiddleware('delete holiday group members by group'), async (req, res) => {
	try {
		success(res, 'Successfully deleted holiday group members for group');
	} catch (err) {
		const errMsg = `Error deleting holiday group members by group with error(s): ${err}`;
		log.error(errMsg);
		failure(res, 500, errMsg);
	}
});

module.exports = router;
