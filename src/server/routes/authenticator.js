/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;
const User = require('../models/User');
const { log } = require('../log');
const validate = require('jsonschema').validate;

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

// Returns middleware that only proceeds if an Admin is the requestor of an action.
// Action is a string that is a verb that is can be prefixed by to for the proper response and warning messages.
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
	optionalAuthMiddleware
};

