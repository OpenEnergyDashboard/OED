/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const _ = require('lodash');
const validate = require('jsonschema').validate;

const Group = require('../models/Group');

const router = express.Router();

/**
 * Given a meter or group, return only the name and ID of that meter or group.
 * This exists to control what data we send to the client.
 * @param item group or meter
 * @returns {{id, name}}
 */
function formatToIDandNameOnly(item) {
	return { id: item.id, name: item.name };
}


/**
 * GET IDs and names of all groups
 */
router.get('/', async (req, res) => {
	try {
		const rows = await Group.getAll();
		res.json(rows.map(formatToIDandNameOnly));
	} catch (err) {
		console.error(`Error while preforming GET all groups query: ${err}`); // eslint-disable-line no-console
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
		console.error(`Error while preforming GET on all immediate children (meters and groups) of specific group: ${err}`); // eslint-disable-line no-console, max-len
	}
});

router.get('/deep/groups/:group_id', async (req, res) => {
	try {
		const [deepGroups] = await Group.getDeepGroupsByGroupID(req.params.group_id);
		res.json({ deepGroups });
	} catch (err) {
		console.error(`Error while preforming GET on all deep child groups of specific group: ${err}`); // eslint-disable-line no-console
	}
});

router.get('/deep/meters/:group_id', async (req, res) => {
	try {
		const [deepMeters] = await Group.getDeepMetersByGroupID(req.params.group_id);
		res.json({ deepMeters });
	} catch (err) {
		console.error(`Error while preforming GET on all deep child meters of specific group: ${err}`); // eslint-disable-line no-console
	}
});

router.post('/create', async (req, res) => {
	const validGroup = {
		type: 'object',
		maxProperties: 3,
		required: ['name', 'childGroups', 'childMeters'],
		properties: {
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
		res.status(400);
	}

	try {
		const newGroup = new Group(undefined, req.body.name);
		await newGroup.insert();
		await Promise.all(req.body.childGroups.map(gid => newGroup.adoptGroup(gid)));
		await Promise.all(req.body.childMeters.map(mid => newGroup.adoptMeter(mid)));

		res.sendStatus(200);
	} catch (err) {
		console.error(`Error while inserting new group ${err}`); // eslint-disable-line no-console
		res.sendStatus(500);
	}
});

router.put('/edit', async (req, res) => {
	const validGroup = {
		type: 'object',
		maxProperties: 4,
		required: ['id', 'name', 'childGroups', 'childMeters'],
		properties: {
			id: {
				type: 'integer'
			},
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
		res.status(400);
	}

	try {
		const currentGroup = Group.getByID(req.body.id);
		if (req.body.name !== currentGroup.name) {
			await currentGroup.rename(req.body.name);
		}

		const currentChildGroups = Group.getImmediateGroupsByGroupID(currentGroup.id);

		const adoptedGroups = _.difference(req.body.childGroups, currentChildGroups);
		if (adoptedGroups.length === 0) {
			await Promise.all(adoptedGroups.map(gid => currentGroup.adoptGroup(gid)));
		}

		const disownedGroups = _.difference(currentChildGroups, req.body.childGroups);
		if (disownedGroups.length === 0) {
			await Promise.all(disownedGroups.map(gid => currentGroup.disownGroup(gid)));
		}

		// Compute meters differences and adopt/disown to make changes
		const currentChildMeters = Group.getImmediateMetersByGroupID(currentGroup.id);

		const adoptedMeters = _.difference(req.body.childMeters, currentChildMeters);
		if (adoptedMeters.length === 0) {
			await Promise.all(adoptedMeters.map(mid => currentGroup.adoptMeter(mid)));
		}

		const disownedMeters = _.difference(currentChildMeters, req.body.childMeters);
		if (disownedMeters.length === 0) {
			await Promise.All(disownedMeters.map(mid => currentGroup.disownMeter(mid)));
		}

		res.sendStatus(200);
	} catch (err) {
		console.error(`Error while editing existing group: ${err}`); // eslint-disable-line no-console
		res.sendStatus(500);
	}
});

module.exports = router;
