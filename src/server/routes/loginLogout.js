/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const secretToken = require('../config').secretToken;
const validate = require('jsonschema').validate;
const { log } = require('../log');
const { getConnection } = require('../db');
const { credentialsRequestValidationMiddleware, verifyActiveTokenAndGetUser } = require('./authenticator');
const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, TOKEN_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH } = require('../util/validationConstants');
const { HTTP_CODES } = require('../util/httpCodes');

const router = express.Router();
/**
 * Authenticate users and return a JSON Web Token with their user ID.
 * @param {String} username
 * @param {String} Password
 */
router.post('/login', credentialsRequestValidationMiddleware, async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		required: ['username', 'password'],
		properties: {
			username: {
				type: 'string',
				minLength: USERNAME_MIN_LENGTH,
				maxLength: USERNAME_MAX_LENGTH
			},
			password: {
				type: 'string',
				minLength: PASSWORD_MIN_LENGTH,
				maxLength: PASSWORD_MAX_LENGTH
			}
		}
	};

	if (!validate(req.body, validParams).valid) {
		res.sendStatus(HTTP_CODES.BAD_REQUEST);
	} else {
		const conn = getConnection();
		try {
			const user = await User.getByUsername(req.body.username, conn);

			// This hash is used only when the username does not exist. It keeps
			// the bcrypt comparison path similar for existing and non-existing
			// users without allowing a missing user to log in.
			const dummyPasswordHash = '$2a$10$N6cWKczGlZaT2ReVzJ48pu8t87bpatdCnpI50fXQ7SnHO23LL7Nfe';
			const passwordHash = user === null ? dummyPasswordHash : user.passwordHash;
			const passwordMatches = await bcrypt.compare(req.body.password, passwordHash);
			const isValid = user !== null && passwordMatches;
			if (isValid) {
				const token = jwt.sign({ data: user.id }, secretToken, { expiresIn: 86400 });
				res.json({ token: token, username: user.username, role: user.role });
			} else {
				throw new Error('Unauthorized password');
			}
		} catch (err) {
			if (err.message === 'Unauthorized password' || err.message === 'No data returned from the query.') {
				res.status(HTTP_CODES.UNAUTHORIZED).send({ text: 'Not authorized' });
			} else {
				log.error(`Unable to check user password for ${req.body.username}`, err);
				res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).send({ text: 'Internal Server Error' });
			}
		}
	}
});

/**
 * Logs out the authenticated user by invalidating previously issued tokens.
 *
 * Note: This route intentionally does not use auth middleware.
 * Authentication is handled by verifyActiveTokenAndGetUser, which verifies
 * the JWT, ensures the user exists, and checks token validity.
 *
 * The user ID is derived from the verified token (not request input),
 * preventing a user from logging out another user.
 */
router.post('/logout', async (req, res) => {
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
		res.sendStatus(HTTP_CODES.BAD_REQUEST);
		return;
	}

	try {
		// This route does not trust a user id from the request body.
		// It authenticates the provided token, ensures the referenced user
		// still exists, and then uses that verified user record to determine
		// which user's tokens should be invalidated.
		const { user } = await verifyActiveTokenAndGetUser(req.body.token);
		const conn = getConnection();
		await User.invalidateTokensBeforeNow(user.id, conn);
		res.status(HTTP_CODES.OK).json({ success: true, message: 'Logout successful.' });
	} catch (error) {
		if (error.code === 'TOKEN_INVALIDATED') {
			res.status(HTTP_CODES.OK).json({ success: true, message: 'Logout successful.' });
		} else if (error.message === 'No data returned from the query.') {
			res.status(HTTP_CODES.UNAUTHORIZED).json({ success: false, message: 'Logout failed.' });
		} else {
			log.error('Logout failed while invalidating user tokens.', error);
			res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Logout failed.' });
		}
	}
});

module.exports = router;
