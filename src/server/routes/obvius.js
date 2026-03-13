/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/obvius route. This route accepts data from
 * Obvius meters, handling parameters passed in form/multipart, GET parameters,
 * or POST body parameters.
 *
 * STATUS mode requests are logged.
 *
 * CONFIGFILEMANIFEST requests are responded to with a dummy manifest which specifies
 * 					  a lack of config files to respond with.
 */

const express = require('express');
const config = require('../config');
const multer = require('multer');
const moment = require('moment');
const md5 = require('md5');
const zlib = require('zlib');
const { log } = require('../log');
const Configfile = require('../models/obvius/Configfile');
const listConfigfiles = require('../services/obvius/listConfigfiles');
const loadLogfileToReadings = require('../services/obvius/loadLogfileToReadings');
const middleware = require('../middleware');
const obvius = require('../util').obvius;
const { obviusUsernameAndPasswordAuthMiddleware } = require('./authenticator');
const { getConnection } = require('../db');
const escapeHtml = require('escape-html');
const { PASSWORD_MAX_LENGTH } = require('../util/validationConstants');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB limit
		files: 10 // Max 10 files
	}
});
const router = express.Router();

// Here, the use of upload.array() allows the lowercaseParams middleware to
// integrate form/multipart data into the generic parameter pipeline along with
// POST and GET params.
router.use(upload.any(), middleware.lowercaseAllParamNames);
router.use(middleware.paramsLookupMixin);

/**
 * Inform the client of a failure (406 Not Acceptable), and log it.
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {string} reason The reason for the failure.
 *
 */
function failure(req, res, reason = '') {
	reason = escapeHtml(reason); // escape html to sanitize html
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	log.error(`Obvius protocol request from ${ip} failed due to ${reason}`);

	res.status(406) // 406 Not Acceptable error, as required by Obvius
		.send(`<pre>\n${reason}\n</pre>\n`);
}

/**
 * Inform the client of a success (200 OK).
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {string} comment Any additional data to be returned to the client.
 *
 */
function success(req, res, comment = '') {
	comment = escapeHtml(comment); // escape html to sanitize html
	res.status(200) // 200 OK
		.send(`<pre>\nSUCCESS\n${comment}</pre>\n`);
}

/**
 * Logs a STATUS request for later examination.
 * @param {express.Request} req the request to process (must have the req.param mixin)
 * @param {express.Response} res the response object
 */
function handleStatus(req, res) {
	// Grab the IP of the requester.
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	// These are all the params OED cares about. They just get logged.
	// Note that this route does NOT log the password, for security reasons.
	const paramNames = ['MODE', 'SENDDATATRACE', 'SERIALNUMBER', 'GSMSIGNAL',
		'LOOPNAME', 'UPTIME', 'PERCENTBLOCKSINUSE', 'PERCENTINODESINUSE',
		'UPLOADATTEMPT', 'ACQUISUITEVERSION', 'USRVERSION', 'ROOTVERSION',
		'KERNELVERSION', 'FIRMWAREVERSION', 'BOOTCOUNT', 'BATTERYGOOD'];
	// Build a log entry for this request
	let s = `Handling request from ${ip}\n`;
	for (const paramName of paramNames) {
		if (req.param(paramName) !== false && req.param(paramName) !== undefined) {
			s += `\tGot ${paramName}: ${req.param(paramName)}\n`;
		} else {
			s += `\tNo ${paramName} submitted\n`;
		}
	}
	log.info(s);

	success(req, res);
}

/**
 * Logs the Obvius request and sets the req.IP field to be the ip address.
 */
function obviusLog(req, res, next) {
	// Log the IP of the requester
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	req.IP = ip;
	log.info(`Received Obvious protocol request from ${ip}`);
	next();
}

/**
 * Verifies an Obvius request via username and password.
 */
function verifyObviusUser(req, res, next) {
	// First we ensure that the password and username parameters are provided.
	const password = req.param('password');
	// TODO This is allowing for backwards compatibility if previous obvius meters are using the'email' parameter
	// instead of the 'username' parameter to login. Developers need to decide in the future if we should deprecate
	// email or continue to allow this backwards compatibility.
	let username;
	if (req.param('email')) {
		username = req.param('email');
		// Treat request as if it had username instead of email
		req.body.username = username;
		delete req.body['email'];
	} else {
		username = req.param('username');
	}

	// The test for password and username existence is redone later with JSONSchema but left since error
	// message is different for historical reasons.
	if (!password) {
		failure(req, res, 'password parameter is required.');
	} else if (!username) {
		failure(req, res, 'username parameter is required.');
	} else if (typeof password !== 'string' || password.length > PASSWORD_MAX_LENGTH) {
		failure(req, res, 'Invalid password format.');
		// TODO 254 should be checked as accurate and then a global const here and in tests.
	} else if (typeof username !== 'string' || username.length > 254) {
		failure(req, res, 'Invalid username format.');
	} else {
		// Authenticate Obvius user after all validation passes.
		// See above for why only have username and not email.
		obviusUsernameAndPasswordAuthMiddleware('Obvius pipeline')(req, res, next);
	}
}


/**
 * Handle an Obvius upload request.
 * Unfortunately the Obvious API does not specify a HTTP verb.
 */
router.all('/', obviusLog, verifyObviusUser, async (req, res) => {
	const ip = req.IP;

	const mode = req.param('mode', false);
	if (mode === false) {
		failure(req, res, 'Request must include mode parameter.');
		return;
	}

	if (mode === obvius.mode.status) {
		handleStatus(req, res);
		return;
	}

	if (mode === obvius.mode.logfile_upload) {
		const serialNumber = req.param('serialnumber', false);
		if (!serialNumber) {
			failure(req, res, 'Logfile Upload Requires Serial Number');
			return;
		}
		if (typeof serialNumber !== 'string' || serialNumber.length > 100) {
			failure(req, res, 'Invalid serial number format');
			return;
		}
		const conn = getConnection();
		const loadLogfilePromises = [];
		for (const fx of req.files) {
			log.info(`Received ${fx.fieldname}: ${fx.originalname}`);
			// Logfiles are always gzipped.
			let data;
			try {
				data = zlib.gunzipSync(fx.buffer);
			} catch (err) {
				log.error(err);
				failure(req, res, `Unable to gunzip incoming buffer: ${err}`);
				return;
			}
			// The original code did not await for the Promise to finish. The new version
			// allows the files to run in parallel (as before) but then wait for them all
			// to finish before returning.
			loadLogfilePromises.push(loadLogfileToReadings(req.param('serialnumber'), ip, data, conn));
		}
		// TODO This version returns an error. Should check all usage to be sure it is properly handled.
		Promise.all(loadLogfilePromises).then(() => {
			success(req, res, 'Logfile Upload IS PROVISIONAL');
		}).catch((err) => {
			log.warn(`Logfile Upload had issues from ip: ${ip}`, err)
			failure(req, res, 'Logfile Upload had issues');
		});
		// This return may not be needed.
		return;
	}

	if (mode === obvius.mode.config_file_download) {
		failure(req, res, 'Config Download Not Implemented');
		return;
	}

	if (mode === obvius.mode.config_file_manifest) {
		const conn = getConnection();
		success(req, res, await listConfigfiles(conn));
		return;
	}

	if (mode === obvius.mode.config_file_upload) {
		// Check required parameters
		const serialNumber = req.param('serialnumber', false);
		const modbusDevice = req.param('modbusdevice', false);

		if (!serialNumber) {
			failure(req, res, 'Config Upload Requires Serial Number');
			return;
		}
		if (!modbusDevice) {
			failure(req, res, 'Config Upload Requires Modbus Device ID');
			return;
		}

		// Basic parameter validation
		if (typeof serialNumber !== 'string' || serialNumber.length > 100) {
			failure(req, res, 'Invalid serial number format');
			return;
		}
		if (typeof modbusDevice !== 'string' || modbusDevice.length > 50) {
			failure(req, res, 'Invalid modbus device format');
			return;
		}
		const conn = getConnection();
		for (const fx of req.files) {
			log.info(`Received ${fx.fieldname}: ${fx.originalname}`);

			let data;
			try {
				data = zlib.gunzipSync(fx.buffer).toString('utf-8');
			} catch (error) {
				data = fx.buffer.toString('utf-8');
			}

			const cf = new Configfile(undefined, req.param('serialnumber'), req.param('modbusdevice'), moment(), md5(data), data, true);
			await cf.insert(conn);
			success(req, res, `Acquired config log with (pseudo)filename ${cf.makeFilename()}.`);
		}
		return;
	}

	if (mode === obvius.mode.test) {
		failure(req, res, 'Test Not Implemented');
		return;
	}

	failure(req, res, `Unknown mode '${mode}'`);
});

module.exports = router;
