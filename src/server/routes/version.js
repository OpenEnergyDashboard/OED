/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const VERSION = require('../version');

const router = express.Router();
/**
 * Returns the version of the application to the client.
 */
router.get('/', (req, res) => {
	res.json(VERSION.toString());
});

module.exports = router;
