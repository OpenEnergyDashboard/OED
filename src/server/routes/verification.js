/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const validate = require('jsonschema').validate;
const { TOKEN_MAX_LENGTH } = require('../util/validationConstants');
const { verifyActiveTokenAndGetUser } = require('./authenticator');
const { HTTP_CODES } = require('../util/httpCodes');
const { success, failure } = require('./response');

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
		failure(res, HTTP_CODES.BAD_REQUEST);
	} else {
		const token = req.body.token;
		verifyActiveTokenAndGetUser(token)
			.then(() => {
				success(res, { success: true });
			})
			.catch(error => {
				failure(res, HTTP_CODES.UNAUTHORIZED, new Error(`Token verification failed: ${error.message}`, { cause: error }), { success: false, message: 'Failed to authenticate token.' });
			});
	}
});

module.exports = router;
