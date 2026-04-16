/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;
const User = require('../models/User');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { isTokenAuthorized, isUserAuthorized } = require('../util/userRoles');
const { getConnection } = require('../db');
const escapeHtml = require('escape-html');
const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, TOKEN_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH }
	= require('../util/validationConstants');

/**
 * Middleware function to require authentication on protected routes.
 * Verifies the request's token, ensures the user exists, and checks that
 * the token has not been invalidated.
 * This middleware is currently used within this file.
 */
const authMiddleware = (req, res, next) => {
	const token = req.headers.token || req.body.token || req.query.token;
	const validParams = {
		type: 'string',
		maxLength: TOKEN_MAX_LENGTH
	};

	if (!validate(token, validParams).valid) {
		res.status(403).json({ success: false, message: 'No token provided or JSON was invalid.' });
	} else if (token) {
		verifyActiveTokenAndGetUser(token)
			.then(({ decoded }) => {
				req.decoded = decoded;
				next();
			})
			.catch(error => {
				if (error.code === 'TOKEN_INVALIDATED') {
					res.status(401).json({ success: false, message: 'Token invalidated.' });
				} else if (error.message === 'No data returned from the query.') {
					res.status(401).json({ success: false, message: 'User does not exist in database.' });
				} else {
					res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
				}
			});
	} else {
		res.status(403).send({ success: false, message: 'No token provided.' });
	}
};

/**
 * Middleware that checks the request body for the username and password parameters. If the body contains the username and password parameters, then next
 * is executed. Otherwise, the server responds with a 400 error.
 */
function credentialsRequestValidationMiddleware(req, res, next) {
	const validParams = {
		type: 'object',
		// Don't use ``additionalProperties: false,`` since there are more parameters for some modes and this
		// is used across all those routes.
		// The route replaces historical email with username so don't need a oneOf to test for one as required.
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
		res.status(400).send('Invalid JSON. \n');
	} else {
		next();
	}
}

/**
 * Verifies the username and password of a user.
 * @param {string} username
 * @param {string} password
 * @param {boolean} returnUser
 * @returns true if the user exists in the database. False otherwise. Returns the user itself if returnUser is set to true and user is verified.
 */
async function verifyCredentials(username, password, returnUser = false) {
	const conn = getConnection();
	const user = await User.getByUsername(username, conn);
	let isValid;
	if (user === null) {
		// User did not exist so return false.
		isValid = false;
	} else {
		isValid = await bcrypt.compare(password, user.passwordHash);
	}
	if (returnUser) {
		return isValid && user;
	} else {
		return isValid;
	}
}

/**
 * Verifies a JWT, ensures the user exists, and rejects tokens that were invalidated.
 * Returns the decoded token and matching user when successful.
 * @param {string} token
 * @returns {Promise<{decoded: object, user: User}>}
 */
async function verifyActiveTokenAndGetUser(token) {
	const decoded = await new Promise((resolve, reject) => {
		jwt.verify(token, secretToken, (err, payload) => {
			if (err) {
				reject(err);
			} else {
				resolve(payload);
			}
		});
	});

	// jwt.verify confirms the token signature is valid, but it does not guarantee
	// the referenced user still exists in the database. The user may have been
	// deleted after the token was issued, so OED must still verify the user record.
	const conn = getConnection();
	const user = await User.getByID(decoded.data, conn);
    // Default to 0 (Unix epoch start) to align with the database default.
    // If tokenInvalidBefore is missing or invalid, tokens issued after epoch remain valid.
	let invalidBefore = 0;
	if (user.tokenInvalidBefore) {
		const parsedDate = new Date(user.tokenInvalidBefore);
		if (!isNaN(parsedDate.getTime())) {
			invalidBefore = Math.floor(parsedDate.getTime() / 1000);
		} else {
			log.error(`Invalid tokenInvalidBefore value for user ${user.id}`);
		}
	}

	const tokenIssuedAt = decoded.iat;
	// Reject tokens issued at or before tokenInvalidBefore so tokens created in
    // the same second as invalidation are not incorrectly treated as valid.
	if (tokenIssuedAt <= invalidBefore) {
		const error = new Error('Token invalidated');
		error.code = 'TOKEN_INVALIDATED';
		throw error;
	}

	return { decoded, user };
}

/**
 * Returns middleware that verifies the requested token and only proceeds if the requestor is a particular user role or is Admin.
 * @param {string} role
 * @param action
 */
function roleTokenAuthMiddleware(role, action) {
	return function (req, res, next) {
		authMiddleware(req, res, async () => {
			const token = req.headers.token || req.body.token || req.query.token;
			if (await isTokenAuthorized(token, role)) {
				next();
			} else {
				log.warn(`Got request to '${action}' with invalid credentials. ${role.toUpperCase()} role is required to '${action}'.`);
				res.status(403)
					.json({ message: `Invalid credentials supplied. Only ${role.toUpperCase()} can ${action}.` });
			}
		})
	}
}

/**
 * Returns middleware that verifies the requested token and only proceeds if the requestor is an ADMIN role.
 */
function adminAuthMiddleware(action) {
	return roleTokenAuthMiddleware(User.role.ADMIN, action);
}

/**
 * Returns middleware that verifies the requested token and only proceeds if the requestor has the EXPORT role.
 */
function exportAuthMiddleware(action) {
	return roleTokenAuthMiddleware(User.role.EXPORT, action);
}

/**
 * Returns middleware that verifies the requested token and only proceeds if the requestor has the CSV role.
 */
function csvAuthMiddleware(action) {
	return roleTokenAuthMiddleware(User.role.CSV, action);
}

/**
 * Returns middleware that only authenticates an Admin or Obvius user via username and password credentials.
 * @param {string} action - is a phrase or word that can be prefixed by 'to' for the proper response and warning messages.
 */
function obviusUsernameAndPasswordAuthMiddleware(action) {
	// TODO This should probably be merged with roleTokenAuthMiddleware.
	return function (req, res, next) {
		credentialsRequestValidationMiddleware(req, res, async () => {
			try {
				const user = await verifyCredentials(req.body.username, req.body.password, true);
				if (user) {
					if (isUserAuthorized(user, User.role.OBVIUS)) {
						next();
					} else {
						const message = `Got request to '${action}' with invalid authorization level. Obvius role is at least required to '${action}'.`;
						log.warn(message);
						res.status(401).send(message);
						return;
					}
				} else {
					const message = `Got request to '${action} with invalid credentials.`;
					log.warn(message);
					res.status(400).send(message);
					return;
				}
			} catch (error) {
				if (error.message === 'No data returned from the query.') {
					res.status(400).send(`No user corresponding to the username: ${escapeHtml(req.body.username)} was found. Please make a request with a valid username.`);
				} else {
					log.error('Internal Server Error for Obvius request.', error);
					res.status(500).send('Internal OED Server Error for Obvius request.');
				}
			}
		});
	}
}

/**
 * Middleware function to force a route to provide optional authentication
 * Verifies the request's token against the server's secret token
 * Sets the req field hasValidAuthToken to true or false
 */
const optionalAuthMiddleware = (req, res, next) => {
	// Set auth token to false initially.
	req.hasValidAuthToken = false;

	const token = req.headers.token || req.body.token || req.query.token;
	const validParams = {
		type: 'string',
		maxLength: TOKEN_MAX_LENGTH
	};

	// If there is no token, there can be no valid token.
	if (!validate(token, validParams).valid) {
		next();
	} else if (token) {
		verifyActiveTokenAndGetUser(token)
			.then(({ decoded }) => {
				req.decoded = decoded;
				req.hasValidAuthToken = true;
				next();
			})
			.catch(() => {
				next();
			});
	} else {
		next();
	}
};

module.exports = {
	authMiddleware,
	adminAuthMiddleware,
	csvAuthMiddleware,
	exportAuthMiddleware,
	obviusUsernameAndPasswordAuthMiddleware,
	optionalAuthMiddleware,
	verifyCredentials,
	verifyActiveTokenAndGetUser,
	credentialsRequestValidationMiddleware
};
