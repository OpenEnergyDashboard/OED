/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const jwt = require('jsonwebtoken');
const secretToken = require('../config').secretToken;
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
	authMiddleware,
	optionalAuthMiddleware
};

