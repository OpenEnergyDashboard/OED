/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const secretToken = require('../config').secretToken;

const router = express.Router();

/**
 * Authenticate users and return a JSON Web Token with their user ID.
 * @param {String} email
 * @param {String} Password
 */
router.post('/', async (req, res) => {
	try {
		const user = await User.getByEmail(req.body.email);
		const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
		if (isValid) {
			const token = jwt.sign({ data: user.id }, secretToken, { expiresIn: 86400 });
			res.json({ token: token });
		} else {
			throw new Error('Unauthorized password');
		}
	} catch (err) {
		if (err.message === 'Unauthorized password' || err.message === 'No data returned from the query.') {
			res.status(401).send({ text: 'Not authorized' });
		} else {
			res.status(500).send({ text: 'Internal Server Error' });
		}
	}
});

module.exports = router;
