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
const adminAuthenticator = require('./authenticator').adminAuthMiddleware;
const optionalAuthenticator = require('./authenticator').optionalAuthMiddleware;
const { log } = require('../log');
const Point = require('../models/Point');
const { failure, success } = require('./response');

const router = express.Router();
router.use(optionalAuthenticator);

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
		deepMeters: item.children, areaUnit: item.areaUnit
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
 * GET info of all groups
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Group.getAll(conn);
		deepChildren = [];
		promises = await rows.map(async (row) => {
			const deepChildren = await Group.getDeepMetersByGroupID(row.id, conn);
			return { ...row, children: deepChildren };
		})
		Promise.all(promises).then(function (values) {
			res.json(values.map(formatGroupForResponse));
		})
	} catch (err) {
		log.error(`Error while preforming GET all groups query: ${err}`, err);
	}
});

router.get('/idname', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Group.getAll(conn);
		res.json(rows.map(formatToOnlyNameID));
	} catch (err) {
		log.error(`Error while performing GET all groups query: ${err}`, err);
	}
});

/**
 * GET meters and groups that are immediate children of a given group
 * This will only return IDs because it queries groups_immediate_children and groups_immediate_meters, which store
 * only the IDs of the children.
 * @param int group_id
 * @returns {[int], [int]}  child meter IDs and child group IDs
 */
router.get('/children/:group_id', async (req, res) => {
	const conn = getConnection();
	try {
		const [meters, groups, deepMeters] = await Promise.all([
			Group.getImmediateMetersByGroupID(req.params.group_id, conn),
			Group.getImmediateGroupsByGroupID(req.params.group_id, conn),
			Group.getDeepMetersByGroupID(req.params.group_id, conn)
		]);
		res.json({ meters, groups, deepMeters });
	} catch (err) {
		log.error(`Error while preforming GET on all immediate children (meters and groups) of specific group: ${err}`, err);
	}
});

/**
 * GET meters and groups that are immediate children of all groups
 * This will only return IDs because it queries groups_immediate_children and groups_immediate_meters, which store
 * only the IDs of the children.
 * @return {[int, [int], [int]]}  array where each entry has the group id, array of child meter IDs and array of child group IDs
 */
router.get('/allChildren/', async (req, res) => {
	// There are not parameters so nothing to verify.
	const conn = getConnection();
	try {
		const allChildren = await Group.getImmediateChildren(conn);
		res.json(allChildren);
	} catch (err) {
		log.error(`Error while preforming GET on all immediate children (meters and groups) of all groups: ${err}`, err);
	}
});

router.get('/deep/groups/:group_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_id'],
		properties: {
			group_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		log.error(`Got request group deep group children with invalid data, errors: ${validatorResult.errors}`);
		failure(res, 400, "Got request group deep group children with invalid data. Error(s): " + validatorResult.errors.toString());
	} else {
		const conn = getConnection();
		try {
			const deepGroups = await Group.getDeepGroupsByGroupID(req.params.group_id, conn);
			res.json({ deepGroups });
		} catch (err) {
			log.error(`Error while preforming GET on all deep child groups of specific group: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

router.get('/deep/meters/:group_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_id'],
		properties: {
			group_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		log.error(`Got request group deep meter children with invalid data, errors: ${validatorResult.errors}`);
		failure(res, 400, "Got request group deep meter children with invalid data. Error(s): " + validatorResult.errors.toString());
	} else {
		const conn = getConnection();
		try {
			const deepMeters = await Group.getDeepMetersByGroupID(req.params.group_id, conn);
			res.json({ deepMeters });
		} catch (err) {
			log.error(`Error while preforming GET on all deep child meters of specific group: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

router.get('/parents/:group_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_id'],
		properties: {
			group_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	const validatorResult = validate(req.params, validParams);
	if (!validatorResult.valid) {
		log.error(`Got request group parents with invalid data, errors: ${validatorResult.errors}`);
		failure(res, 400, "Got request group parents with invalid data. Error(s): " + validatorResult.errors.toString());
	} else {
		const conn = getConnection();
		try {
			const parentGroups = await Group.getParentsByGroupID(req.params.group_id, conn);
			res.json(parentGroups);
		} catch (err) {
			log.error(`Error while preforming GET on all parents of specific group: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

router.post('/create', adminAuthenticator('create groups'), async (req, res) => {
	const validGroup = {
		type: 'object',
		maxProperties: 10,
		required: ['name', 'childGroups', 'childMeters'],
		properties: {
			id: { type: 'integer' },
			name: {
				type: 'string',
				minLength: 1
			},
			displayable: {
				type: 'bool'
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
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			area: { type: 'number', minimum: 0 },
			childGroups: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				}
			},
			childMeters: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				}
			},
			defaultGraphicUnit: { type: 'integer' },
			areaUnit: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.areaUnitType)
			}
		}
	};

	const validatorResult = validate(req.body, validGroup);
	if (!validatorResult.valid) {
		log.error(`Got request to create group with invalid data, errors: ${validatorResult.errors}`);
		failure(res, 400, "Got request to creat group with invalid data. Error(s): " + validatorResult.errors.toString());
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
			if (err.toString() === 'error: duplicate key value violates unique constraint "groups_name_key"') {
				failure(res, 400, err.toString() + ' with detail ' + err['detail']);
			} else {
				log.error(`Error while inserting new group ${err}`, err);
				failure(res, 500, err.toString() + ' with detail ' + err['detail']);
			}
		}
	}
});

router.put('/edit', adminAuthenticator('edit groups'), async (req, res) => {
	const validGroup = {
		type: 'object',
		maxProperties: 10,
		required: ['id', 'name', 'childGroups', 'childMeters'],
		properties: {
			id: { type: 'integer' },
			name: {
				type: 'string',
				minLength: 1
			},
			displayable: {
				type: 'bool'
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
					{ type: 'string' },
					{ type: 'null' }
				]
			},
			area: { type: 'number', minimum: 0 },
			childGroups: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				}
			},
			childMeters: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				}
			},
			defaultGraphicUnit: { type: 'integer' },
			areaUnit: {
				type: 'string',
				minLength: 1,
				enum: Object.values(Unit.areaUnitType)
			}
		}
	};

	const validatorResult = validate(req.body, validGroup);
	if (!validatorResult.valid) {
		log.error(`Got request to edit group with invalid data, errors: ${validatorResult.errors}`);
		failure(res, 400, "Got request to edit group with invalid data. Error(s): " + validatorResult.errors.toString());
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
			res.sendStatus(200);
		} catch (err) {
			if (err.message && err.message === 'Cyclic group detected') {
				res.status(400).send({ message: err.message });
			} else {
				log.error(`Error while editing existing group ${err}`, err);
				res.sendStatus(500);
			}
		}
	}
});

router.post('/delete', adminAuthenticator('delete groups'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['id'],
		properties: {
			id: { type: 'integer' }
		}
	};

	const validatorResult = validate(req.body, validParams);
	if (!validatorResult.valid) {
		log.error(`Got request to delete group with invalid data, errors: ${validatorResult.errors}`);
		failure(res, 400, "Got request to delete group with invalid data. Error(s): " + validatorResult.errors.toString());
	} else {
		const conn = getConnection();
		try {
			await Group.delete(req.body.id, conn);
			res.sendStatus(200);
		} catch (err) {
			log.error(`Error while deleting group ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;

