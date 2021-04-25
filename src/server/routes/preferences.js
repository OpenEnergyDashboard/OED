/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Preferences = require('../models/Preferences');
const { log } = require('../log');
const adminAuthenticator = require('./authenticator').adminAuthMiddleware;
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');

const router = express.Router();

/**
 * Route for getting the preferences
 */
router.get('/', async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Preferences.get(conn);
		res.json(rows);
	} catch (err) {
		log.error(`Error while performing GET all preferences query: ${err}`, err);
	}
});

router.use(adminAuthenticator('edit site preferences'));

/**
 * Route for updating the preferences
 * @param user_id
 */
router.post('/', async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['preferences'],
		properties: {
			preferences: {
				displayTitle: {
					type: 'string'
				},
				defaultChartToRender: {
					type: 'string'
				},
				defaultBarStacking: {
					type: 'boolean'
				},
				defaultLanguage: {
					type: 'string'
				},
				defaultTimezone: {
					oneOf: [
						{ type: 'string' },
						{ type: 'null' }
					]
				}
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			const rows = await Preferences.update(req.body.preferences, conn);
			res.json(rows);
		} catch (err) {
			log.error(`Error while performing POST update preferences: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;

