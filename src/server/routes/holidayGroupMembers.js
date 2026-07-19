/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { log } = require('../log');
const { getConnection } = require('../db');
const HolidayGroupMember = require('../models/HolidayGroupMember');
const { success, failure } = require('./response');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

function formatHolidayGroupMemberForResponse(item) {
	return {
		holidayInstanceGroupId: item.holiday_instance_group_id,
		holidayInstanceId: item.holiday_instance_id,
		holidayInstanceName: item.holiday_instance_name,
		holidayId: item.holiday_id,
		dayPatternId: item.day_pattern_id,
		holidayName: item.holiday_name,
		startDate: item.start_date,
		location: item.location,
		dayPatternName: item.day_pattern_name
	};
}

function formatHolidayDateCountForResponse(item) {
	return {
		startDate: item.start_date,
		holidayCount: Number(item.holiday_count)
	};
}

/**
 * Route for getting holiday group members, with joined holiday instance, holiday, and day pattern details,
 * for a holiday instance group
 *
 * Route params:
 * - holidayInstanceGroupId: numeric holiday instance group id
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
		const conn = getConnection();
		try {
			const rows = await HolidayGroupMember.getByGroupId(req.params.holidayInstanceGroupId, conn);
			res.json(rows.map(formatHolidayGroupMemberForResponse));
		} catch (err) {
			log.error(`Error while performing GET holiday group members query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for getting resolved holiday dates for a holiday instance group
 *
 * Route params:
 * - holidayInstanceGroupId: numeric holiday instance group id
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
		const conn = getConnection();
		try {
			const rows = await HolidayGroupMember.getHolidayDatesByGroupId(req.params.holidayInstanceGroupId, conn);
			res.json(rows.map(formatHolidayDateCountForResponse));
		} catch (err) {
			log.error(`Error while performing GET holiday dates by group query: ${err}`);
			res.sendStatus(500);
		}
	}
});

/**
 * Route for adding a holiday instance to a holiday instance group
 *
 * Request body:
 * - holidayInstanceGroupId: group id to add the instance to
 * - holidayInstanceId: holiday instance id to add
 */
router.post('/add', adminAuthMiddleware('add holiday group member'), async (req, res) => {
	const validHolidayGroupMember = {
		type: 'object',
		maxProperties: 2,
		required: ['holidayInstanceGroupId', 'holidayInstanceId'],
		properties: {
			holidayInstanceGroupId: {
				type: 'integer',
				minimum: 0
			},
			holidayInstanceId: {
				type: 'integer',
				minimum: 0
			}
		}
	};

	const validatorResult = validate(req.body, validHolidayGroupMember);
	if (!validatorResult.valid) {
		const errMsg = `Got request to add a holiday group member with invalid holiday group member data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			const newHolidayGroupMember = new HolidayGroupMember(
				req.body.holidayInstanceGroupId,
				req.body.holidayInstanceId
			);
			await newHolidayGroupMember.insert(conn);
			success(res, 'Successfully added holiday group member');
		} catch (err) {
			const errMsg = `Error adding holiday group member with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for removing one holiday instance from a holiday instance group
 *
 * Request body:
 * - holidayInstanceGroupId: group id to remove the instance from
 * - holidayInstanceId: holiday instance id to remove
 */
router.post('/delete', adminAuthMiddleware('delete holiday group member'), async (req, res) => {
	const validHolidayGroupMember = {
		type: 'object',
		maxProperties: 2,
		required: ['holidayInstanceGroupId', 'holidayInstanceId'],
		properties: {
			holidayInstanceGroupId: {
				type: 'integer',
				minimum: 0
			},
			holidayInstanceId: {
				type: 'integer',
				minimum: 0
			}
		}
	};

	const validatorResult = validate(req.body, validHolidayGroupMember);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete a holiday group member with invalid holiday group member data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await HolidayGroupMember.deleteHolidayGroupMember(
				req.body.holidayInstanceGroupId,
				req.body.holidayInstanceId,
				conn
			);
			success(res, 'Successfully deleted holiday group member');
		} catch (err) {
			const errMsg = `Error deleting holiday group member with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

/**
 * Route for removing all holiday instances from a holiday instance group
 *
 * Request body:
 * - holidayInstanceGroupId: group id whose members should be removed
 */
router.post('/deleteByGroup', adminAuthMiddleware('delete holiday group members by group'), async (req, res) => {
	const validHolidayGroupMembersDeleteByGroup = {
		type: 'object',
		maxProperties: 1,
		required: ['holidayInstanceGroupId'],
		properties: {
			holidayInstanceGroupId: {
				type: 'integer',
				minimum: 0
			}
		}
	};

	const validatorResult = validate(req.body, validHolidayGroupMembersDeleteByGroup);
	if (!validatorResult.valid) {
		const errMsg = `Got request to delete holiday group members by group with invalid data, error(s): ${validatorResult.errors}`;
		log.warn(errMsg);
		failure(res, 400, errMsg);
	} else {
		const conn = getConnection();
		try {
			await HolidayGroupMember.deleteByGroupId(req.body.holidayInstanceGroupId, conn);
			success(res, 'Successfully deleted holiday group members for group');
		} catch (err) {
			const errMsg = `Error deleting holiday group members by group with error(s): ${err}`;
			log.error(errMsg);
			failure(res, 500, errMsg);
		}
	}
});

module.exports = router;
