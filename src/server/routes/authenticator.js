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
const escapeHtml = require('core-js/fn/string/escape-html');

/**
 * Middleware function to force a route to require authentication
 * Verifies the request's token against the server's secret token
 */
authMiddleware = (req, res, next) => {
	const token = req.headers.token || req.body.token || req.query.token;
	const validParams = {
		type: 'string'
	};
	if (!validate(token, validParams).valid) {
		res.status(403).json({ success: false, message: 'No token provided or JSON was invalid.' });
	} else if (token) {
		jwt.verify(token, secretToken, async (err, decoded) => {
			if (err) {
				res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
			} else {
				try {
					const conn = getConnection();
					await User.getByID(decoded.data, conn); // checks if user exists in the database in case it was deleted
					req.decoded = decoded;
					next();
				} catch (error) {
					res.status(401).json({ success: false, message: 'User does not exist in database.' });
				}
			}
		});
	} else {
		res.status(403).send({ success: false, message: 'No token provided.' });
	}
};

/**
 * Middleware that checks the request body for the email and password parameters. If the body contains the email and password parameters, then next 
 * is executed. Otherwise, the server responds with a 400 error.
 */
function credentialsRequestValidationMiddleware(req, res, next) {
	const validParams = {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: {
				type: 'string',
				minLength: 5,
				maxLength: 254
			},
			password: {
				type: 'string',
				minLength: 8
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
 * Verifies the email and password of a user.
 * @param {string} email 
 * @param {string} password 
 * @param {boolean} returnUser 
 * @returns true if the user exists in the database. False otherwise. Returns the user itself if returnUser is set to true and user is verified.
 */
async function verifyCredentials(email, password, returnUser = false) {
	const conn = getConnection();
	const user = await User.getByEmail(email, conn);
	const isValid = await bcrypt.compare(password, user.passwordHash);
	if (returnUser) {
		return isValid && user;
	} else {
		return isValid;
	}
}

/**
 * Returns middleware that verifies the requested token and only proceeds if the requestor is a particular user role or is Admin.
 * @param {string} role 
 * @param action 
 */
function roleTokenAuthMiddleware(role, action) {
	return function (req, res, next) {
		this.authMiddleware(req, res, async () => {
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
 * Returns middleware that only authenticates an Admin or Obvius user via email and password credentials.
 * @param {string} action - is a phrase or word that can be prefixed by 'to' for the proper response and warning messages.
 */
function obviusEmailAndPasswordAuthMiddleware(action) {
	return function (req, res, next) {
		credentialsRequestValidationMiddleware(req, res, async () => {
			try {
				const user = await verifyCredentials(req.body.email, req.body.password, true);
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
					res.status(400).send(`No user corresponding to the email: ${escapeHtml(req.body.email)} was found. Please make a request with a valid email.`);
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
optionalAuthMiddleware = (req, res, next) => {
	// Set auth token to false initially.
	req.hasValidAuthToken = false;

	const token = req.headers.token || req.body.token || req.query.token;
	const validParams = {
		type: 'string'
	};

	// If there is no token, there can be no valid token.
	if (!validate(token, validParams).valid) {
		next();
	} else if (token) {
		jwt.verify(token, secretToken, (err, decoded) => {
			if (err) {
				// do nothing. Could log here if need be
			} else {
				req.decoded = decoded;
				req.hasValidAuthToken = true;
			}
			next();
		});
	} else {
		next();
	}
};

module.exports = {
	adminAuthMiddleware,
	authMiddleware,
	csvAuthMiddleware,
	exportAuthMiddleware,
	obviusEmailAndPasswordAuthMiddleware,
	optionalAuthMiddleware
};