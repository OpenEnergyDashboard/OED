/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { logMailer } = require('../logMailer');
const { log } = require('../log');
const { getConnection } = require('../db');

(async function sendLoggingEmail() {
	let conn = getConnection();
	try {
		await logMailer(conn);
	} catch (err) {
		log.error(`Error while sending email: ${err}`, err, true);
	}
}());

