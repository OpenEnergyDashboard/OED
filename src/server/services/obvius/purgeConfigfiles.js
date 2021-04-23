/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Configfile = require('../../models/obvius/Configfile');
const { log } = require('../../log');
const { getConnection } = require('../../db');

async function purgeConfigfiles() {
	log.info('Purging Obvius config logs.');
	const conn = getConnection();
	try {
		Configfile.purgeAll(conn);
	} catch (err) {
		log.error(`Error purging Obvius config logs: ${err}`, err);
	}
}

purgeConfigfiles();
