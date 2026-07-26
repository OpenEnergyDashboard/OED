/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');
const { getConnection } = require('../db');
const TimeScaleDBReading = require('../models/TimeScaleDB/Reading');
// TODO: Remove this retained legacy import once the hypertable implementation is finalized.
// const Reading = require('../models/Reading');

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
 * Refreshes the TimescaleDB reading aggregates while holding a shared
 * advisory lock so concurrent imports cannot refresh them simultaneously.
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
			// TODO: Remove these retained legacy refresh calls once the hypertable implementation is finalized.
			// await timedRefresh('Legacy meter reading views refresh', () => Reading.refreshMeterReadingsViews(task));
			if (rebuild) {
				await timedRefresh('TimescaleDB reading aggregates rebuild', () => TimeScaleDBReading.rebuildReadings(task));
			} else {
				await timedRefresh('TimescaleDB reading aggregates range refresh', () =>
					TimeScaleDBReading.refreshReadings(task, startTimestamp, endTimestamp));
			}
			// await timedRefresh('Legacy group reading views refresh', () => Reading.refreshGroupReadingsViews(task));
		} finally {
			await task.one('SELECT pg_advisory_unlock(${lockId})', { lockId: REFRESH_ADVISORY_LOCK_ID });
		}
	});
	log.info('All reading aggregates synchronized');
}

module.exports = refreshAllReadingViews;
