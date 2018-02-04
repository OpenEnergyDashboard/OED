/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;
const validate = require('jsonschema').validate;

const router = express.Router();

/**
 * Route for verifying a JWT.
 * @param token
 */
router.post('/', (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['token'],
		properties: {
			token: {
				type: 'string'
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.sendStatus(400);
	} else {
		const token = req.body.token;
		jwt.verify(token, secretToken, err => {
			if (err) {
				res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
			} else {
				res.status(200).json({ success: true });
			}
		});
	}
});

module.exports = router;
