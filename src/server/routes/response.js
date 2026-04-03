/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Functions to return a code and comment from an Express request.

const DOMPurify = require('../services/utils/sanitizer');

/**
 * Inform the client of a success (200 OK) with sanitized content.
 *
 * @param {express.Response} res The Express response object.
 * @param {string} comment Any additional data to be returned to the client as a string.
 */
function success(res, comment = '') {
	const safeComment = DOMPurify.sanitize(comment);
	res.status(200).send(safeComment);
}

/**
 * Inform the client of a failure with provided code or 500, using sanitized content.
 *
 * @param {express.Response} res The Express response object.
 * @param {number} code The code number to send back for the request.
 * @param {string} comment Any additional data to be returned to the client as a string.
 */
function failure(res, code = 500, comment = '') {
	const safeComment = DOMPurify.sanitize(comment);
	res.status(code).send(safeComment);
}

module.exports = { success, failure };
