/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');

const { getConnection } = require('../db');
const Reading = require('../models/Reading');

// While the name of this function is refreshReadingViews, the purpose
// of this function is to refresh the materialized daily views.
// To make changes in refreshing all reading views, modify
// /src/services/refreshAllReadingViews.js.
/**
 * Refreshes daily view.
 */
async function refreshReadingViews() {
	const conn = getConnection();

	log.info('Refreshing Materialized Daily Reading Views');
	await Reading.refreshCompressedReadings(conn);
	log.info('Views Refreshed');
}

module.exports = { refreshReadingViews };