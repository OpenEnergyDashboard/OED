/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Group = require('../models/Group');

const _ = require('lodash');

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
	try {
		const newGroup = new Group(undefined, req.group.name);
		await newGroup.insert();
		await req.group.childGroups.forEach(gid => newGroup.adoptGroup(gid));
		await req.group.childMeters.forEach(mid => newGroup.adoptMeter(mid));

		res.sendStatus(201);
	} catch (err) {
		console.error(`Error while inserting new group ${err}`); // eslint-disable-line no-console
		res.sendStatus(500);
	}
});

router.put('/edit', async (req, res) => {
	try {
		const currentGroup = Group.getByID(req.group.id);
		if (req.group.name !== currentGroup.name) {
			await currentGroup.rename(req.group.name);
		}

		const currentChildGroups = Group.getImmediateGroupsByGroupID(currentGroup.id);

		const adoptedGroups = _.difference(req.group.childGroups, currentChildGroups);
		if (adoptedGroups !== []) {
			await adoptedGroups.forEach(gid => currentGroup.adoptGroup(gid));
		}

		const disownedGroups = _.difference(currentChildGroups, req.group.childGroups);
		if (disownedGroups !== []) {
			await disownedGroups.forEach(gid => currentGroup.disownGroup(gid));
		}


		const currentChildMeters = Group.getImmediateMetersByGroupID(currentGroup.id);

		const adoptedMeters = _.difference(req.group.childMeters, currentChildMeters);
		if (adoptedMeters !== []) {
			await adoptedMeters.forEach(mid => currentGroup.adoptMeter(mid));
		}

		const disownedMeters = _.difference(currentChildMeters, req.group.childMeters);
		if (disownedMeters !== []) {
			await disownedMeters.forEach(mid => currentGroup.disownMeter(mid));
		}

		res.sendStatus(202);
	} catch (err) {
		console.error(`Error while editing existing group: ${err}`); // eslint-disable-line no-console
		res.sendStatus(500);
	}
});
module.exports = router;
