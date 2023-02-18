/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express')

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
	.send(`<h1>SUCCESS</h1>${comment}`);
}

/**
 * Inform the client of a failure (400 OK).
 *
 * @param {express.Request} req The Express request object
 * @param {express.Response} res The Express response object
 * @param {string} comment Any additional data to be returned to the client.
 *
 */
function failure(req, res, comment = '') {
	// 400 is client error. There is a small chance the insert into the DB failed
	// but overlooking that.
	res.status(400)
	.send(`<h1>FAILURE</h1>${comment}`);

}

module.exports = { success, failure };
