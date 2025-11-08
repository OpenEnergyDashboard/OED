/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');
const { getConnection } = require('../db');
const Reading = require('../models/Reading');

/** 
 * This function is changed from refreshing hourly and daily readings
 * views in parallel using Promise.all() into one by one because
 * daily readings calculation depends on hourly readings.
*/
async function refreshAllReadingViews() {
	const conn = getConnection();
	// Refresh meter readings views
	log.info('Refreshing Materialized Hourly and Daily Readings Views');
	await Reading.refreshMeterReadingsViews(conn);
	log.info('Materialized Hourly and Daily Readings Views Refreshed');
	// Refresh group views
	log.info('Refreshing Group Reading Views');
	await Promise.all([Reading.refreshGroupDailyReadings(conn), Reading.refreshGroupHourlyReadings(conn)]);
	log.info('Group Views Refreshed');
}

module.exports = { refreshAllReadingViews };