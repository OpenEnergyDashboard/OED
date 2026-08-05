/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const flatten = require('lodash/flatten');
const difference = require('lodash/difference');
const validate = require('jsonschema').validate;
const Unit = require('../models/Unit');
const { getConnection } = require('../db');
const Group = require('../models/Group');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const Point = require('../models/Point');
const { failure, success, LogLevel } = require('./response');
const { HTTP_CODES } = require('../util/httpCodes');
const { STRING_GENERAL_MAX_LENGTH, STRING_SHORT_MAX_LENGTH: SHORT_STRING_MAX_LENGTH, NUMERIC_ID_MAX_LENGTH } = require('../util/validationConstants');

const router = express.Router();

/**
 * Given a meter or group, return id, name, displayable, gps, note, area.
 * This exists to control what data we send to the client.
 * @param item group or meter
 * @param gps GPS Point
 * @param displayable boolean
 * @param note string
 * @param area number
 * @returns {{id, name, gps, displayable, note, area}}
 */
function formatGroupForResponse(item) {
	return {
		id: item.id, name: item.name, gps: item.gps, displayable: item.displayable,
		note: item.note, area: item.area, defaultGraphicUnit: item.defaultGraphicUnit,
		deepMeters: item.deepMeters, deepGroups: item.deepGroups, areaUnit: item.areaUnit
	};
}

/**
 * Given a meter or group, return only the name and ID of that meter or group.
 * This exists to control what data we send to the client.
 * @param item group or meter
 * @returns {{id, name}}
 */
function formatToOnlyNameID(item) {
	return { id: item.id, name: item.name };
}

/**
 * Validates the body of a group create/edit request.
 * isEdit=true includes the required 'id' property (edit); isEdit=false excludes it (create), since
 * id is assigned by the DB on insert.
 * @param params req.body for a group create or edit request
 * @param isEdit whether this is validating an edit (true) or create (false) request
 * @returns {{valid: boolean, errors: array}}
 */
function validateGroupsParams(params, isEdit = true) {
	const properties = {
		name: {
			type: 'string',
			minLength: 1,
			maxLength: SHORT_STRING_MAX_LENGTH
		},
		displayable: {
			type: 'boolean'
		},
		gps: {
			oneOf: [
				{
					type: 'object',
					required: ['latitude', 'longitude'],
					properties: {
						latitude: { type: 'number', minimum: '-90', maximum: '90' },
						longitude: { type: 'number', minimum: '-180', maximum: '180' }
					}
				},
				{ type: 'null' }
			]
		},
		note: {
			oneOf: [
				{ type: 'string', maxLength: STRING_GENERAL_MAX_LENGTH },
				{ type: 'null' }
			]
		},
		area: { type: 'number', minimum: 0 },
		childGroups: {
			type: 'array',
			uniqueItems: true,
			maxItems: 1000,
			items: {
				type: 'integer',
				minimum: 1
			}
		},
		childMeters: {
			type: 'array',
			uniqueItems: true,
			maxItems: 1000,
			items: {
				type: 'integer',
				minimum: 1
			}
		},
		defaultGraphicUnit: { 'anyOf': [{ type: 'integer', minimum: 1 }, { type: 'integer', 'enum': [-99] }] },
		areaUnit: {
			type: 'string',
			minLength: 1,
			maxLength: 50,
			enum: Object.values(Unit.areaUnitType)
		}
	};
 
	const required = ['name', 'childGroups', 'childMeters'];
 
	if (isEdit) {
		properties.id = { type: 'integer', minimum: 1 };
		required.push('id');
	}
 
	const validGroup = {
		type: 'object',
		additionalProperties: false,
		required,
		// Original /edit schema had no maxProperties cap; added 10 here (9 create-mode properties + id)
		// to keep edit's property-count check consistent with create's, since this is otherwise the same schema.
		maxProperties: isEdit ? 10 : 9,
		properties
	};
	const validatorResult = validate(params, validGroup);
	return { valid: validatorResult.valid, errors: validatorResult.errors };
}

/**
 * GET info of all groups
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Group.getAll(conn);
		const promises = rows.map(async (row) => {
			const deepMeters = await Group.getDeepMetersByGroupID(row.id, conn);
			return { ...row, deepMeters: deepMeters};
		});
		const values = await Promise.all(promises);
		res.json(values.map(formatGroupForResponse));
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET all groups query: ${err.message}`, { cause: err }));
	}
});

// TODO It is unclear if all these routes can be used by non-admins.
// This should be checked an updated as needed.

router.get('/idname', optionalAuthMiddleware, async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Group.getAll(conn);
		res.json(rows.map(formatToOnlyNameID));
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET all groups id and name query: ${err.message}`, { cause: err }));
	}
});

/**GET info of all deep group children for every group
 * Will return an array where every entry is a group with deep groups property
 * @param item group
*/
router.get('/deep/groups', adminAuthMiddleware('view deep groups'), async (req, res) => {
	const conn = getConnection();
	try{
		const rows = await Group.getAll(conn);
		const promises = rows.map(async (row) => {
			const deepGroups = await Group.getDeepGroupsByGroupID(row.id, conn);
			return { ...row, deepGroups: deepGroups, deepMeters: [] };
		});
		const values = await Promise.all(promises);
		res.json(values.map(formatGroupForResponse));
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET deep groups for all groups query: ${err.message}`, { cause: err }));
	}
});

/**
 * GET meters and groups that are immediate children of a given group
 * This will only return IDs because it queries groups_immediate_children and groups_immediate_meters, which store
 * only the IDs of the children.
 * @param int group_id
 * @returns {[int], [int]}  child meter IDs and child group IDs
 */
router.get('/children/:group_id', optionalAuthMiddleware, async (req, res) => {
	const conn = getConnection();
	try {
		const [meters, groups, deepMeters] = await Promise.all([
			Group.getImmediateMetersByGroupID(req.params.group_id, conn),
			Group.getImmediateGroupsByGroupID(req.params.group_id, conn),
			Group.getDeepMetersByGroupID(req.params.group_id, conn)
		]);
		res.json({ meters, groups, deepMeters });
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET on all immediate children (meters and groups) of specific group: ${err.message}`, { cause: err }));
	}
});

/**
 * GET meters and groups that are immediate children of all groups
 * This will only return IDs because it queries groups_immediate_children and groups_immediate_meters, which store
 * only the IDs of the children.
 * @return {[int, [int], [int]]}  array where each entry has the group id, array of child meter IDs and array of child group IDs
 */
router.get('/allChildren/', optionalAuthMiddleware, async (req, res) => {
	// There are not parameters so nothing to verify.
	const conn = getConnection();
	try {
		const allChildren = await Group.getImmediateChildren(conn);
		res.json(allChildren);
	} catch (err) {
		failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET on all immediate children (meters and groups) of all groups: ${err.message}`, { cause: err }));
	}
});

router.get('/deep/groups/:group_id', optionalAuthMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		required: ['group_id'],
		properties: {
			group_id: {
				type: 'string',
				pattern: '^\\d+$',
				maxLength: NUMERIC_ID_MAX_LENGTH
			}
		}
	};
	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const message = "Got request group deep group children with invalid data. Error(s): " + validatorResult.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
	} else {
		const conn = getConnection();
		try {
			const deepGroups = await Group.getDeepGroupsByGroupID(req.params.group_id, conn);
			res.json({ deepGroups });
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET on all deep child groups of specific group: ${err.message}`, { cause: err }));
		}
	}
});

router.get('/deep/meters/:group_id', optionalAuthMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		required: ['group_id'],
		properties: {
			group_id: {
				type: 'string',
				pattern: '^\\d+$',
				maxLength: NUMERIC_ID_MAX_LENGTH
			}
		}
	};
	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const message = "Got request group deep meter children with invalid data. Error(s): " + validatorResult.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
	} else {
		const conn = getConnection();
		try {
			const deepMeters = await Group.getDeepMetersByGroupID(req.params.group_id, conn);
			res.json({ deepMeters });
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET on all deep child meters of specific group: ${err.message}`, { cause: err }));
		}
	}
});

router.get('/parents/:group_id', optionalAuthMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		required: ['group_id'],
		properties: {
			group_id: {
				type: 'string',
				pattern: '^\\d+$',
				maxLength: NUMERIC_ID_MAX_LENGTH
			}
		}
	};
	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		const message = "Got request group parents with invalid data. Error(s): " + validatorResult.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
	} else {
		const conn = getConnection();
		try {
			const parentGroups = await Group.getParentsByGroupID(req.params.group_id, conn);
			res.json(parentGroups);
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while performing GET on all parents of specific group: ${err.message}`, { cause: err }));
		}
	}
});

router.post('/create', adminAuthMiddleware('create groups'), async (req, res) => {
	// isEdit=false: id must not be present, since it's assigned by the DB on insert.
	const validatorResult = validateGroupsParams(req.body, false);

	if (!validatorResult.valid) {
		const message = "Got request to create group with invalid data. Error(s): " + validatorResult.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
	} else {
		const conn = getConnection();
		try {
			await conn.tx(async t => {
				const newGPS = (req.body.gps) ? new Point(req.body.gps.longitude, req.body.gps.latitude) : null;
				const newGroup = new Group(
					undefined,
					req.body.name,
					req.body.displayable,
					newGPS,
					req.body.note,
					req.body.area,
					req.body.defaultGraphicUnit,
					req.body.areaUnit
				);

				await newGroup.insert(t);
				const adoptGroupsQuery = req.body.childGroups.map(gid => newGroup.adoptGroup(gid, t));
				const adoptMetersQuery = req.body.childMeters.map(mid => newGroup.adoptMeter(mid, t));
				return t.batch(flatten([adoptGroupsQuery, adoptMetersQuery]));
			});
			success(res);
		} catch (err) {
			// Group duplicate-name DB errors to a safe 400 response
			if (err.toString() === 'error: duplicate key value violates unique constraint "groups_name_key"') {
				failure(res, HTTP_CODES.BAD_REQUEST, err, 'Group name already exists', LogLevel.SILENT);
			} else {
				const detail = err['detail'] ? ` with detail ${err['detail']}` : '';
				failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while inserting new group: ${err.message}${detail}`, { cause: err }));
			}
		}
	}
});

router.put('/edit', adminAuthMiddleware('edit groups'), async (req, res) => {
	// isEdit=true: id is required here since the client must tell us which group to update.
	const validatorResult = validateGroupsParams(req.body, true);

	if (!validatorResult.valid) {
		const message = "Got request to edit group with invalid data. Error(s): " + validatorResult.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
	} else {
		try {
			const conn = getConnection();
			const currentGroup = await Group.getByID(req.body.id, conn);
			const currentChildGroups = await Group.getImmediateGroupsByGroupID(currentGroup.id, conn);
			const currentChildMeters = await Group.getImmediateMetersByGroupID(currentGroup.id, conn);

			await conn.tx(async t => {
				const newGPS = (req.body.gps) ? new Point(req.body.gps.longitude, req.body.gps.latitude) : null;
				const newGroup = new Group(
					req.body.id,
					req.body.name,
					req.body.displayable,
					newGPS,
					req.body.note,
					req.body.area,
					req.body.defaultGraphicUnit,
					req.body.areaUnit
				);

				await newGroup.update(t);

				const adoptedGroups = difference(req.body.childGroups, currentChildGroups);
				const adoptGroupsQueries = adoptedGroups.map(gid => currentGroup.adoptGroup(gid, t));

				const disownedGroups = difference(currentChildGroups, req.body.childGroups);
				const disownGroupsQueries = disownedGroups.map(gid => currentGroup.disownGroup(gid, t));

				// Compute meters differences and adopt/disown to make changes
				const adoptedMeters = difference(req.body.childMeters, currentChildMeters);
				const adoptMetersQueries = adoptedMeters.map(mid => currentGroup.adoptMeter(mid, t));

				const disownedMeters = difference(currentChildMeters, req.body.childMeters);
				const disownMetersQueries = disownedMeters.map(mid => currentGroup.disownMeter(mid, t));

				return t.batch(flatten([adoptGroupsQueries, disownGroupsQueries, adoptMetersQueries, disownMetersQueries]));
			});
			success(res);
		} catch (err) {
			if (err.message && err.message === 'Cyclic group detected') {
				failure(res, HTTP_CODES.BAD_REQUEST, err, err.message, LogLevel.SILENT);
			} else {
				failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while editing existing group: ${err.message}`, { cause: err }));
			}
		}
	}
});

router.post('/delete', adminAuthMiddleware('delete groups'), async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		required: ['id'],
		properties: {
			id: { type: 'integer', minimum: 1 }
		}
	};

	const validatorResult = validate(req.body, validParams);
	if (!validatorResult.valid) {
		const message = "Got request to delete group with invalid data. Error(s): " + validatorResult.errors.toString();
		failure(res, HTTP_CODES.BAD_REQUEST, message, message);
	} else {
		const conn = getConnection();
		try {
			await Group.delete(req.body.id, conn);
			success(res);
		} catch (err) {
			failure(res, HTTP_CODES.INTERNAL_SERVER_ERROR, new Error(`Error while deleting group: ${err.message}`, { cause: err }));
		}
	}
});

module.exports = router;
