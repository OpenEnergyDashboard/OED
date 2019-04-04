/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { getConnection, dropConnection } = require('../db');
const Reading = require('../models/Reading');
/* tslint:disable no-console */
async function refreshReadingViews() {
	const conn = getConnection();
	console.log('Refreshing reading views');
	await Reading.refreshCompressedReadings(conn);
	console.log('Views refreshed');
	dropConnection();
}

refreshReadingViews();
