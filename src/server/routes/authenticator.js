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
module.exports = (req, res, next) => {
	const token = req.headers.token || req.body.token || req.query.token;
	const validParams = {
		type: 'string',
	};
	if (!validate(token, validParams).valid) {
		res.sendStatus(400);
	} else if (token) {
		jwt.verify(token, secretToken, (err, decoded) => {
			if (err) {
				res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
			}
			req.decoded = decoded;
			next();
		});
	} else {
		res.status(403).send({
			success: false,
			message: 'No token provided.'
		});
	}
};
