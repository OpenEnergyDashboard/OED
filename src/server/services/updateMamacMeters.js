/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Meter = require('../models/Meter');
const readMamacData = require('./readMamacData');
const updateMeters = require('./updateMeters');
const stopDB = require('../models/database').stopDB;
const { log } = require('../log');

async function updateMamacMeters() {
	log.info('Fetching new Mamac meter data');
	try {
		const allMeters = await Meter.getAll();
		const metersToUpdate = allMeters.filter(m => m.enabled && m.type === Meter.type.MAMAC);
		await updateMeters(readMamacData, metersToUpdate);
	} catch (err) {
		log.error(`Error fetching Mamac meter data: ${err}`, err);
	} finally {
		stopDB();
	}
}

updateMamacMeters();
