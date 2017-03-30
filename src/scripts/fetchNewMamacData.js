/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const updateMeters = require('../server/services/updateMeters');
const stopDB = require('../server/models/database').stopDB;

async function fetchNewMamacDataWrapper() {
	console.log('Fetching new Mamac meter data');
	try {
		await updateMeters();
	} catch (e) {
		console.error('Error fetching Mamac meter data:');
		console.error(e);
	} finally {
		stopDB();
	}
}

fetchNewMamacDataWrapper();
