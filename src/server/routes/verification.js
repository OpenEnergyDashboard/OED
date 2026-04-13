/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const validate = require('jsonschema').validate;
const { TOKEN_MAX_LENGTH } = require('../util/validationConstants');
const { log } = require('../log');
const { verifyActiveTokenAndGetUser } = require('./authenticator');

const router = express.Router();

/**
 * Route for verifying a JWT.
 * Verifies that the token is cryptographically valid, belongs to an
 * existing user, and has not been invalidated by server-side session
 * invalidation logic.
 * @param token
 */
router.post('/', (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['token'],
		properties: {
			token: {
				type: 'string',
				maxLength: TOKEN_MAX_LENGTH
			}
		}
	};

	if (!validate(req.body, validParams).valid) {
		res.sendStatus(400);
	} else {
		const token = req.body.token;

		verifyActiveTokenAndGetUser(token)
			.then(() => {
				res.json({ success: true });
			})
			.catch(error => {
				if (error.code === 'TOKEN_INVALIDATED') {
					res.status(401).json({ success: false, message: 'Token invalidated.' });
		        } else if (error.message === 'No data returned from the query.') {
                    log.error('Token verification failed because the referenced user does not exist.', error);
                	res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
                } else {
                    log.error('Token verification failed.', error);
                	res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
                }
			});
	}
});

module.exports = router;
