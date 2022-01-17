/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');

const { getConnection } = require('../db');
const Reading = require('../models/Reading');

async function refreshHourlyReadingViews() {
	const conn = getConnection();

	log.info('Refreshing Materialized Hourly Reading Views');
	await Reading.refreshCompressedHourlyReadings(conn);
	log.info('Materialized Hourly Views Refreshed');
}

module.exports = { refreshHourlyReadingViews };