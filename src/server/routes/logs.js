/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const express = require('express');
const { log } = require('../log');
const validate = require('jsonschema').validate;
const adminAuthenticator = require('./authenticator').adminAuthMiddleware;

const router = express.Router();
router.use(adminAuthenticator('log API'));

const validLog = {
	type: 'object',
	required: ['message'],
	properties: {
		message: {
			type: 'string',
			minLength: 1
		}
	}
}
router.post('/info', async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.info(req.body.message);
		res.sendStatus(200);
	} else {
		log.error('invalid input from client logger');
		res.sendStatus(400);
	}
});

router.post('/warn', async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.warn(req.body.message);
		res.sendStatus(200);
	} else {
		log.error('invalid input from client logger');
		res.sendStatus(400);
	}
});

router.post('/error', async (req, res) => {
	const validationResult = validate(req.body, validLog);
	if (validationResult.valid) {
		log.error(req.body.message);
		res.sendStatus(200);
	} else {
		log.error('invalid input from client logger');
		res.sendStatus(400);
	}
});

module.exports = router;
