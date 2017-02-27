/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Group = require('../models/Group');

const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const rows = await Group.getAll();
		res.json(rows);
	} catch (err) {
		console.error(`Error while preforming GET all groups query: ${err}`); // eslint-disable-line no-console
	}
});
