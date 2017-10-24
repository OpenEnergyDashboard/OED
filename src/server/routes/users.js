/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const User = require('../models/User');

const router = express.Router();

/**
 * Route for getting all users
 */
router.get('/', async (req, res) => {
	try {
		const rows = await User.getAll();
		res.json(rows);
	} catch (err) {
		console.error(`Error while performing GET all users query: ${err}`); // eslint-disable-line no-console
	}
});

/**
 * Route for getting a specific user by ID
 * @param user_id
 */
router.get('/:user_id', async (req, res) => {
	try {
		const rows = await User.getByID(req.params.user_id);
		res.json(rows);
	} catch (err) {
		console.error(`Error while performing GET specific user by id query: ${err}`); // eslint-disable-line no-console
	}
});

module.exports = router;
