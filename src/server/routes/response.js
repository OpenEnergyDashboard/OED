/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Functions to return a code and comment from an Express request.
const { HTTP_CODES } = require('../util/httpCodes');
const { log, LogLevel } = require('../log');

/**
 * Inform the client of a success (200 OK).
 *
 * @param res The Express response object
 * @param comment Any additional data to be returned to the client as a string
 *
 */
function success(res, comment = '') {
	res.status(HTTP_CODES.OK)
		.send(comment);
}

/**
 * Inform the client of a failure with provided code or 500. Logs internally so routes
 * do not need to call log.error()/log.warn()/etc. themselves.
 *
 * @param res The Express response object
 * @param code The code number to send back for request
 * @param error The Error (or detail) causing the failure. Only ever logged, never sent to the client.
 * @param safeMessage A message safe to show the client. Only used for codes under 500;
 *  500-level failures always get the generic message below regardless of what is passed here.
 * @param {LogLevel} severity The LogLevel (DEBUG/INFO/WARN/ERROR/SILENT — see log.js) to log this
 *  failure at. Defaults to LogLevel.ERROR so logging happens at the most visible level unless a
 *  route chooses otherwise. Pass LogLevel.SILENT to suppress logging for this failure entirely
 *  (replaces the old boolean skipLog). The level chosen also determines whether this failure
 *  triggers an admin e-mail, per Logger's emailLevel threshold in log.js — e.g. LogLevel.WARN
 *  will not e-mail admins by default, while LogLevel.ERROR will.
 *
 */
function failure(res, code = HTTP_CODES.INTERNAL_SERVER_ERROR, error = null, safeMessage = '', severity = LogLevel.ERROR) {
	if (severity !== LogLevel.SILENT && error) {
		const logMessage = error instanceof Error ? error.message : String(error);
		log.log(severity, logMessage, error instanceof Error ? error : undefined);
	}
	// Return a generic message for 500-level failures so internal details never reach the client.
	const responseBody = code >= HTTP_CODES.INTERNAL_SERVER_ERROR
		? 'Internal Server Error. Details are in the OED logs that are available to your site admin(s).'
		: safeMessage;
	res.status(code)
		.send(responseBody);
}

// Re-export LogLevel so routes only need to import from here, not from log.js directly,
// to pass a severity (e.g. LogLevel.WARN, LogLevel.SILENT) into failure().
module.exports = { success, failure, LogLevel };
