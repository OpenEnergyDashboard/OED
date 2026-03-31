/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const User = require('../models/User');
const { getConnection } = require('../db');
const { authMiddleware } = require('./authenticator');

const router = express.Router();

/**
 * Invalidates previously issued tokens for the authenticated user.
 */
router.post('/', authMiddleware, async (req, res) => {
	const conn = getConnection();
	try {
		await User.invalidateTokensBeforeNow(req.decoded.data, conn);
		res.status(200).json({ success: true, message: 'Logged out successfully.' });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
});

module.exports = router;
