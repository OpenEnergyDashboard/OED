/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Preferences = require('../models/Preferences');
const { log } = require('../log');
const authentication = require('./authenticator');

const router = express.Router();

/**
 * Route for getting the preferences
 */
router.get('/', async (req, res) => {
	try {
		const rows = await Preferences.get();
		res.json(rows);
	} catch (err) {
		log.error(`Error while performing GET all preferences query: ${err}`, err);
	}
});

router.use(authentication);

/**
 * Route for updating the preferences
 * @param user_id
 */
router.post('/', async (req, res) => {
	try {
		const rows = await Preferences.update(req.body.preferences);
		res.json(rows);
	} catch (err) {
		log.error(`Error while performing POST update preferences: ${err}`, err);
	}
});

module.exports = router;
