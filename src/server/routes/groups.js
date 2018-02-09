/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const _ = require('lodash');
const validate = require('jsonschema').validate;

const Group = require('../models/Group');
const db = require('../models/database').db;
const authenticator = require('./authenticator');
const { log } = require('../log');

const router = express.Router();

/**
 * Given a meter or group, return only the name and ID of that meter or group.
 * This exists to control what data we send to the client.
 * @param item group or meter
 * @returns {{id, name}}
 */
function formatToOnlyNameAndID(item) {
	return { id: item.id, name: item.name };
}


/**
 * GET IDs and names of all groups
 */
router.get('/', async (req, res) => {
	try {
		const rows = await Group.getAll();
		res.json(rows.map(formatToOnlyNameAndID));
	} catch (err) {
		log.error(`Error while preforming GET all groups query: ${err}`, err);
	}
});


/**
 * GET meters and groups that are immediate children of a given group
 * This will only return IDs because it queries groups_immediate_children and groups_immediate_meters, which store
 * only the IDs of the children.
 * @param int group_id
 * @return {[int], [int]}  child meter IDs and child group IDs
 */
router.get('/children/:group_id', async (req, res) => {
	try {
		const [meters, groups] = await Promise.all([
			Group.getImmediateMetersByGroupID(req.params.group_id),
			Group.getImmediateGroupsByGroupID(req.params.group_id)
		]);
		res.json({ meters, groups });
	} catch (err) {
		log.error(`Error while preforming GET on all immediate children (meters and groups) of specific group: ${err}`, err);
	}
});

router.get('/deep/groups/:group_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['group_id'],
		properties: {
			group_id: {
				type: 'number'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		try {
			const [deepGroups] = await Group.getDeepGroupsByGroupID(req.params.group_id);
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
			meter_id: {
				type: 'number'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		try {
			const [deepMeters] = await Group.getDeepMetersByGroupID(req.params.group_id);
			res.json({ deepMeters });
		} catch (err) {
			log.error(`Error while preforming GET on all deep child meters of specific group: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

router.use(authenticator);

router.post('/create', async (req, res) => {
	const validGroup = {
		type: 'object',
		maxProperties: 4,
		required: ['token', 'name', 'childGroups', 'childMeters'],
		properties: {
			token: { type: 'string' },
			name: {
				type: 'string',
				minLength: 1,
			},
			childGroups: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				},
			},
			childMeters: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				},
			}
		}
	};

	if (!validate(req.body, validGroup).valid) {
		res.sendStatus(400);
	} else {
		try {
			await db.tx(async t => {
				const newGroup = new Group(undefined, req.body.name);
				await newGroup.insert(t);
				const adoptGroupsQuery = req.body.childGroups.map(gid => newGroup.adoptGroup(gid, t));
				const adoptMetersQuery = req.body.childMeters.map(mid => newGroup.adoptMeter(mid, t));
				return t.batch(_.flatten([adoptGroupsQuery, adoptMetersQuery]));
			});
			res.sendStatus(200);
		} catch (err) {
			log.error(`Error while inserting new group ${err}`, err);
			res.sendStatus(500);
		}
	}
});

router.put('/edit', async (req, res) => {
	const validGroup = {
		type: 'object',
		maxProperties: 5,
		required: ['token', 'id', 'name', 'childGroups', 'childMeters'],
		properties: {
			token: { type: 'string' },
			id: { type: 'integer' },
			name: {
				type: 'string',
				minLength: 1,
			},
			childGroups: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				},
			},
			childMeters: {
				type: 'array',
				uniqueItems: true,
				items: {
					type: 'integer'
				},
			}
		}
	};

	if (!validate(req.body, validGroup).valid) {
		res.sendStatus(400);
	} else {
		try {
			const currentGroup = await Group.getByID(req.body.id);
			const currentChildGroups = await Group.getImmediateGroupsByGroupID(currentGroup.id);
			const currentChildMeters = await Group.getImmediateMetersByGroupID(currentGroup.id);

			await db.tx(t => {
				let nameChangeQuery = [];
				if (req.body.name !== currentGroup.name) {
					nameChangeQuery = currentGroup.rename(req.body.name, t);
				}

				const adoptedGroups = _.difference(req.body.childGroups, currentChildGroups);
				const adoptGroupsQueries = adoptedGroups.map(gid => currentGroup.adoptGroup(gid));

				const disownedGroups = _.difference(currentChildGroups, req.body.childGroups);
				const disownGroupsQueries = disownedGroups.map(gid => currentGroup.disownGroup(gid));

				// Compute meters differences and adopt/disown to make changes
				const adoptedMeters = _.difference(req.body.childMeters, currentChildMeters);
				const adoptMetersQueries = adoptedMeters.map(mid => currentGroup.adoptMeter(mid));

				const disownedMeters = _.difference(currentChildMeters, req.body.childMeters);
				const disownMetersQueries = disownedMeters.map(mid => currentGroup.disownMeter(mid));

				return t.batch(_.flatten([nameChangeQuery, adoptGroupsQueries, disownGroupsQueries, adoptMetersQueries, disownMetersQueries]));
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

router.post('/delete', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 2,
		required: ['token', 'id'],
		properties: {
			token: { type: 'string' },
			id: { type: 'integer' }
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.sendStatus(400);
	} else {
		try {
			await Group.delete(req.body.id);
			res.sendStatus(200);
		} catch (err) {
			log.error(`Error while deleting group ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;
