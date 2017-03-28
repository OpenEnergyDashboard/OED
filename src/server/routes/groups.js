/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Group = require('../models/Group');

const router = express.Router();

/**
 * GET IDs and names of all groups
 */
router.get('/', async (req, res) => {
	try {
		const rows = await Group.getAll();
		res.json(rows);
	} catch (err) {
		console.error(`Error while preforming GET all groups query: ${err}`); // eslint-disable-line no-console
	}
});

/**
 * GET meters and groups that are immediate children of a given group
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

module.exports = router;
