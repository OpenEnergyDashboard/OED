/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');
const { getConnection } = require('../db');
const Reading = require('../models/Reading');
const TimeScaleDBReading = require('../models/TimeScaleDB/Reading');

// Arbitrary, stable application namespace key for a session-level PostgreSQL
// advisory lock. Every aggregate refresher must use this same key; the numeric
// value has no transaction ID or database-object meaning.
// Introduced because meter_hourly_readings was initially encountering deadlocks.
const REFRESH_ADVISORY_LOCK_ID = 724536221;

async function timedRefresh(label, operation) {
	const start = Date.now();
	await operation();
	log.info(`${label} completed in ${Date.now() - start} ms`);
}

/** 
 * This function is changed from refreshing hourly and daily readings
 * views in parallel using Promise.all() into one by one because
 * daily readings calculation depends on hourly readings.
*/
async function refreshAllReadingViews(options = {}) {
	const { startTimestamp = null, endTimestamp = null, rebuild = startTimestamp === null && endTimestamp === null } = options;
	if ((startTimestamp === null) !== (endTimestamp === null)) {
		throw new Error('Both startTimestamp and endTimestamp are required for a bounded reading refresh.');
	}

	const conn = getConnection();
	await conn.task(async task => {
		await task.one('SELECT pg_advisory_lock(${lockId})', { lockId: REFRESH_ADVISORY_LOCK_ID });
		try {
			await timedRefresh('Legacy meter reading views refresh', () => Reading.refreshMeterReadingsViews(task));

			if (rebuild) {
				await timedRefresh('TimescaleDB reading aggregates rebuild', () => TimeScaleDBReading.rebuildReadings(task));
			} else {
				await timedRefresh('TimescaleDB reading aggregates range refresh', () =>
					TimeScaleDBReading.refreshReadings(task, startTimestamp, endTimestamp));
			}

			await timedRefresh('Legacy group reading views refresh', () => Reading.refreshGroupReadingsViews(task));
		} finally {
			await task.one('SELECT pg_advisory_unlock(${lockId})', { lockId: REFRESH_ADVISORY_LOCK_ID });
		}
	});
	log.info('All reading aggregates synchronized');
}

module.exports = refreshAllReadingViews;
