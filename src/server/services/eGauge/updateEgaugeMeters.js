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
const { refreshCompressedReadings, refreshCompressedHourlyReadings } = require('../../models/Reading');

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
		// Ignoring that loadArrayInput is called in this sequence and returns values
		// since this is only called by an automated process at this time.
		// Issues from the pipeline will be logged by called functions.
		await updateMeters(readEgaugeData, metersToUpdate, conn);
		// We refresh the readings so they can be graphed to see the new ones.
		// TODO If the system is getting other types of meters this may cause the refresh
		// to happen multiple times. Might want to work on this in the future.
		await refreshCompressedReadings(conn);
		await refreshCompressedHourlyReadings(conn);
	} catch (err) {
		log.error(`Error fetching eGauge meter data: ${err}`, err);
	}
	log.info('Completed fetching new eGauge meter data');
}

// run the update.
updateEgaugeMeters();
