/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const User = require('../models/User');
const { log } = require('../log');
const validate = require('jsonschema').validate;

const router = express.Router();

/**
 * Route for getting all users
 */
router.get('/', async (req, res) => {
	try {
		const rows = await User.getAll();
		res.json(rows);
	} catch (err) {
		log.error(`Error while performing GET all users query: ${err}`, err);
	}
});

/**
 * Route for getting a specific user by ID
 * @param user_id
 */
router.get('/:user_id', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['user_id'],
		properties: {
			group_id: {
				type: 'id'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		try {
			const rows = await User.getByID(req.params.user_id);
			res.json(rows);
		} catch (err) {
			log.error(`Error while performing GET specific user by id query: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;
