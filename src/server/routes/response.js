/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Functions to return a code and comment from an Express request.
const { HTTP_CODES } = require('../util/httpCodes');

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
 * Inform the client of a failure with provided code or 500.
 *
 * @param res The Express response object
 * @param code The code number to send back for request
 * @param comment Any additional data to be returned to the client as a string
 *
 */
function failure(res, code = HTTP_CODES.INTERNAL_SERVER_ERROR, comment = '') {
	// Return a generic message for 500-level failures.
	const responseBody = code >= HTTP_CODES.INTERNAL_SERVER_ERROR ? 'Internal Server Error. Details are in the OED logs that are available to your site admin(s).' : comment;
	res.status(code)
	.send(responseBody);

}

module.exports = { success, failure };
