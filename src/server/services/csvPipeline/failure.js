/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { CSVPipelineError } = require('./CustomErrors');
const escapeHtml = require('core-js/fn/string/escape-html');
const { log } = require('../../log');

/**
 * Inform the client of a failure (406 Not Acceptable), and log it.
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {Error || CSVPipelineError.class} error The reason for the failure.
 *
 */
function failure(req, res, error, statusCode = 400) {
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (error instanceof CSVPipelineError) {
		const { logMessage, responseMessage } = error.data;
		log.error(`Csv protocol request from ${ip} failed due to ${logMessage}`, error);
		res.status(statusCode)
			.send(`<pre>\n${escapeHtml(responseMessage)}\n</pre>\n`);
	} else { // we do not actually expect to reach this case however just in case we receive an error we still want to respond.
		const { message } = error;
		log.error(`Csv protocol request from ${ip} failed due to ${error.message}`, error);
		res.status(statusCode)
			.send(`<pre>\n${escapeHtml(message)}\n</pre>\n`);
	}
}

module.exports = failure;