/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file implements the /api/obvius route. This route accepts data from Obvius meters, handling parameters
 * passed in form/multipart, GET parameters, or POST body parameters.
 *
 * STATUS mode requests are logged.
 *
 * CONFIGFILEMANIFEST requests are responded to with a dummy manifest which specifies
 * 					  a lack of config files to respond with.
 */

const express = require('express');
const config = require('../config');
const multer = require('multer');
const { log } = require('../log');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const MODE_STATUS = 'STATUS';
const MODE_LOGFILE_UPLOAD = 'LOGFILEUPLOAD';
const MODE_CONFIG_MANIFEST = 'CONFIGFILEMANIFEST';
const MODE_CONFIG_UPLOAD = 'CONFIGFILEUPLOAD';
const MODE_CONFIG_DOWNLOAD = 'CONFIGFILEDOWNLOAD';
const MODE_TEST = 'MODE_TEST';

const LOGFILE_FILENAME = 'LOGFILE';

/**
 * Inform the client of a failure (406 Not Acceptable), and log it.
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {string} reason The reason for the failure.
 *
 */
function failure(req, res, reason = '') {
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
 * A middleware to lowercase all params, including those passed by form/multipart
 */
function lowercaseParams(req, res, next) {
	for (const key of Object.entries(req.query)) {
		req.query[key[0].toLowerCase()] = key[1];
	}
	for (const key of Object.entries(req.params)) {
		req.params[key[0].toLowerCase()] = key[1];
	}
	if (req.body) {
		for (const key of Object.entries(req.body)) {
			req.body[key[0].toLowerCase()] = key[1];
		}
	}
	next();
}
// Here, the use of upload.array() allows the lowercaseParams middleware to integrate form/multipart data
// into the generic parameter pipeline along with POST and GET params.
router.use(upload.single(LOGFILE_FILENAME), lowercaseParams);

/**
 * A middleware to add our params mixin.
 * This mixin adds a function, req.param, which when combined with the above code allows
 * all types of parameters (GET query parameters)
 */
router.use((req, res, next) => {
	// Mixin for getting parameters from any possible method.
	req.param = (param, defaultValue) => {
		param = param.toLowerCase();
		// If the param exists as a route param, use it.
		if (typeof req.params[param] !== 'undefined') {
			return req.params[param];
		}
		// If the param exists as a body param, use it.
		if (req.body && typeof req.body[param] !== 'undefined') {
			return req.body[param];
		}
		// Return the query param, if it exists.
		if (typeof req.query[param] !== 'undefined') {
			return req.query[param];
		}
		// Return the default value if all else fails.
		return defaultValue;
	};

	next();
});

/**
 * Handle an Obvius upload request.
 * Unfortunately the Obvious API does not specify a HTTP verb.
 */
router.all('/', async (req, res) => {
	// Log the IP of the requester
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	log.info(`Received Obvious protocol request from ${ip}`);

	// Attempt to verify the password
	if (!req.param('password')) {
		failure(req, res, 'password parameter is required.');
		return;
	} else if (req.param('password') !== config.obvius.password) {
		failure(req, res, 'password was not correct.');
		return;
	}

	const mode = req.param('mode', false);
	if (mode === false) {
		failure(req, res, 'Request must include mode parameter.');
		return;
	}

	if (mode === MODE_STATUS) {
		handleStatus(req, res);
		return;
	}

	if (mode === MODE_LOGFILE_UPLOAD) {
		log.info(`Received file: ${req.file}`);
		failure(req, res, 'Logfile Upload Not Implemented');
		return;
	}

	if (mode === MODE_CONFIG_DOWNLOAD) {
		failure(req, res, 'Config Download Not Implemented');
		return;
	}

	if (mode === MODE_CONFIG_MANIFEST) {
		// Returns a dummy config manifest.
		// The blank/empty timestamp will always indicate an out-of-date manifest.
		// The checksum is a dummy.
		const response = 'CONFIGFILE,loggerconfig.ini,42a48182862fa5044d1ac7b294bc6f97,0000-00-00 00:00:00\n';
		success(req, res, response);
		return;
	}

	if (mode === MODE_CONFIG_UPLOAD) {
		failure(req, res, 'Config Upload Not Implemented');
		return;
	}

	if (mode === MODE_TEST) {
		failure(req, res, 'Test Not Implemented');
		return;
	}

	failure(req, res, `Unknown mode '${mode}'`);
});

module.exports = router;
