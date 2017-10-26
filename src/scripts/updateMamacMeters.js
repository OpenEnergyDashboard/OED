/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const updateMeters = require('../server/services/updateMeters');
const stopDB = require('../server/models/database').stopDB;
const log = require('../server/log');

async function updateMamacMeters() {
	log('Fetching new Mamac meter data');
	try {
		await updateMeters();
	} catch (err) {
		log(`Error fetching Mamac meter data: ${err}`, 'error');
	} finally {
		stopDB();
	}
}

updateMamacMeters();
