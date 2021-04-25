/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');

const { getConnection } = require('../db');
const Reading = require('../models/Reading');
/* tslint:disable no-console */
async function refreshReadingViews() {
	const conn = getConnection();

	log.info('Refreshing Reading Views');
	await Reading.refreshCompressedReadings(conn);
	log.info('Views Refreshed');
}

refreshReadingViews();
