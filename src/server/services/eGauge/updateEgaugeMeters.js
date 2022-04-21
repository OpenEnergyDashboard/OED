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

async function updateEgaugeMeters() {
	const conn = getConnection();
	log.info('Fetching new eGauge meter data');
	try {
		const allMeters = await Meter.getEnabled(conn);
		// console.log(allMeters);
		const metersToUpdate = allMeters.filter(m => m.type === Meter.type.EGAUGE);
		// Ignoring that loadArrayInput is called in this sequence and returns values
		// since this is only called by an automated process at this time.
		// Issues from the pipeline will be logged by called functions.
		await updateMeters(readEgaugeData, metersToUpdate, conn);
		await refreshCompressedReadings(conn);
		await refreshCompressedHourlyReadings(conn);
	} catch (err) {
		log.error(`Error fetching eGauge meter data: ${err}`, err);
	}
}

updateEgaugeMeters();