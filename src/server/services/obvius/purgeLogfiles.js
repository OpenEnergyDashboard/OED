/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Logfile = require('../../models/obvius/Logfile');
const stopDB = require('../../models/database').stopDB;
const { log } = require('../../log');

async function purgeLogfiles() {
	log.info('Purging Obvius config logs.');
	try {
		Logfile.purgeAll();
	} catch (err) {
		log.error(`Error purging Obvius config logs: ${err}`, err);
	} finally {
		stopDB();
	}
}

purgeLogfiles();
