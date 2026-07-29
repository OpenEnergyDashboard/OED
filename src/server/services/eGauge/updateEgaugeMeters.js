/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Meter = require('../../models/Meter');
const updateMeters = require('../updateMeters');
const { log } = require('../../log');
const { getConnection } = require('../../db');
const readEgaugeData = require('./readEgaugeData');
const refreshAllReadingViews = require('../refreshAllReadingViews');

/**
 * For every enabled eGauge meter, update the readings in the database.
 */
async function updateEgaugeMeters() {
	const conn = getConnection();
	log.info('Fetching new eGauge meter data');
	try {
		// Only work with meters that are enabled to get readings.
		const allMeters = await Meter.getEnabled(conn);
		// We only want the eGauge meters.
		const metersToUpdate = allMeters.filter(m => m.type === Meter.type.EGAUGE);
		// Issues from the pipeline are logged by the called functions. Successful
		// results include the accepted reading range for each meter.
		const updateResults = await updateMeters(readEgaugeData, metersToUpdate, conn);
		const readingRanges = updateResults.filter(result => result.startTimestamp && result.endTimestamp);

		// Refresh the readings so newly imported values can be graphed. Combining
		// all meter ranges keeps this to one refresh without checking unrelated
		// historical buckets.
		// TODO If the system gets other meter types in the same schedule, coordinate
		// their ranges so aggregate refreshes are not performed multiple times.
		if (readingRanges.length > 0) {
			const startTimestamp = readingRanges.reduce((earliest, result) =>
				result.startTimestamp.isBefore(earliest) ? result.startTimestamp : earliest,
			readingRanges[0].startTimestamp);
			const endTimestamp = readingRanges.reduce((latest, result) =>
				result.endTimestamp.isAfter(latest) ? result.endTimestamp : latest,
			readingRanges[0].endTimestamp);
			await refreshAllReadingViews({ startTimestamp, endTimestamp });
		}
	} catch (err) {
		log.error(`Error fetching eGauge meter data: ${err}`, err);
	}
	log.info('Completed fetching new eGauge meter data');
}

// run the update.
updateEgaugeMeters();
