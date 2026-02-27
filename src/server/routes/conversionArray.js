/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { getConnection } = require('../db');
const { redoCik } = require('../services/graph/redoCik');
const { refreshAllReadingViews } = require('../services/refreshAllReadingViews');
const validate = require('jsonschema').validate;
const { adminAuthMiddleware } = require('./authenticator');

const router = express.Router();

/**
 * Route for redoing Cik and/or refreshing reading views.
 */
router.post('/refresh', adminAuthMiddleware('conversion refresh system data'), async (req, res) => {
	const validParams = {
		type: 'object',
		additionalProperties: false,
		properties: {
			redoCik: {
				type: 'boolean'
			},
			refreshReadingViews: {
				type: 'boolean'
			}
		}
	};

	if (!validate(req.body, validParams).valid) {
		res.sendStatus(400);
		return;
	}

	// TODO: Add try/catch error handling to properly handle failures during Cik refresh
	// or reading view refresh operations and return appropriate error responses.
	if (req.body.redoCik) {
		const conn = getConnection();
		await redoCik(conn);
	}
	if (req.body.refreshReadingViews) {
		await refreshAllReadingViews();
	}
	res.sendStatus(200);
});

module.exports = router;
