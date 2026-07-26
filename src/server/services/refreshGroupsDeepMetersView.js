/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');
const { getConnection } = require('../db');
// TODO: Remove this redundant pre-hypertable refresh path once the hypertable implementation is finalized.
// const Group = require('../models/Group');
const TimeScaleDBReading = require('../models/TimeScaleDB/Reading');
// TODO: Remove this retained legacy import once the hypertable implementation is finalized.
// const Reading = require('../models/Reading');

async function refreshGroupsDeepMetersView() {
    const conn = getConnection();
	// TODO: Remove this retained legacy refresh block once the hypertable implementation is finalized.
	// log.info('Refreshing Materialized Groups Deep Meters View');
	// await Group.refreshGroupsDeepMetersView(conn);
	// log.info('Materialized Groups Deep Meters View Refreshed');
	// log.info('Refreshing Group Reading Views');
	// await Reading.refreshGroupReadingsViews(conn);
	// log.info('...Group Views Refreshed!');
    // refreshGroupReadings updates both group caches before refreshing only
    // the group aggregates. Meter aggregates are maintained independently.
	log.info('Refreshing TimeScaleDB Group Reading Views');
	// TODO: Remove this retained broad refresh once the hypertable implementation is finalized.
	// await TimeScaleDBReading.refreshReadings(conn);
	await TimeScaleDBReading.refreshGroupReadings(conn);
	log.info('...TimeScaleDB Group Views Refreshed!');
}

module.exports = { refreshGroupsDeepMetersView };
