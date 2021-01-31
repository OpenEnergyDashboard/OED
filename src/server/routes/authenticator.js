/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;
const User = require('../models/User');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');

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
		jwt.verify(token, secretToken, (err, decoded) => {
			if (err) {
				res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		res.status(403).send({ success: false, message: 'No token provided.' });
	}
};

/**
 * Authenticate users via email and password.
 */
async function emailAndPasswordAuthMiddleware(req, res, next) {
	const validParams = {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: {
				type: 'string',
				minLength: 3,
				maxLength: 254
			},
			password: {
				type: 'string',
				minLength: 3
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.status(400).send('Invalid JSON. \n');
	} else {
		const conn = getConnection();
		try {
			const user = await User.getByEmail(req.body.email, conn);
			const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
			if (isValid) {
				// We use the decoded field to be consistent with authMiddleware. 
				// The stored information is also consistent with the information stored in a jwt token.
				req.decoded = {
					data: user.id,
					role: user.role
				};
				next();
			} else {
				throw new Error('Unauthorized password');
			}
		} catch (err) {
			if (err.message === 'Unauthorized password' || err.message === 'No data returned from the query.') {
				res.status(401).send({ text: 'Not authorized' });
			} else {
				log.error(`Unable to check user password for ${req.body.email}`, err);
				res.status(500).send({ text: 'Internal Server Error' });
			}
		}
	}
};

// Returns middleware that only proceeds if an Admin is the requestor of an action.
// Action is a string that is a verb that can be prefixed by to for the proper response and warning messages.
adminAuthMiddleware = (action) => {
	return function (req, res, next) {
		this.authMiddleware(req, res, () => {
			if (req.decoded && req.decoded.role === User.role.ADMIN) {
				next();
			} else {
				log.warn(`Got request to \'${action}\' with invalid credentials. Admin role is required to \'${action}\'.`);
				res.status(400)
					.json({ message: `Invalid credentials supplied. Only admins can ${action}.` });
			}
		})
	}
}

/**
 * Returns middleware that only authenticates an Admin or Obvius user.
 * @param {string} action - is a phrase or word that can be prefixed by 'to' for the proper response and warning messages.
 */
function obviusEmailAndPasswordAuthMiddleware(action) {
	return function (req, res, next) {
		emailAndPasswordAuthMiddleware(req, res, () => {
			if (req.decoded && (req.decoded.role === User.role.ADMIN || req.decoded.role === User.role.OBVIUS)) {
				next();
			} else {
				log.warn(`Got request to \'${action}\' with invalid credentials. Admin or Obvius role is required to \'${action}\'.`);
				res.status(400)
					.json({ message: `Invalid credentials supplied. Only admins or Obvius users can ${action}.` });
			}
		})
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
	obviusEmailAndPasswordAuthMiddleware,
	optionalAuthMiddleware
};

