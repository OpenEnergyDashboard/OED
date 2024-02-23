/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const { getConnection } = require('../db');
const { redoCik } = require('../services/graph/redoCik');
const { refreshAllReadingViews } = require('../services/refreshAllReadingViews');

const router = express.Router();

/**
 * Route for redoing Cik and/or refreshing reading views.
 */
router.post('/refresh', async (req, res) => {
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
