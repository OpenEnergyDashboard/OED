/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const { log } = require('../../log');
const demuxCsvWithSingleColumnTimestamps = require('./csvDemux');
const loadArrayInput = require('./loadArrayInput');

async function insertObviusData(serialNumber, ipAddress, logfile) {
	// Get demultiplexed, parsed data from the CSV.
	const data = demuxCsvWithSingleColumnTimestamps(logfile);

	for (let i = 0; i < data.length; i++) {
		let meter;
		try {
			meter = await Meter.getByName(`${serialNumber}.${i}`);
		} catch (v) {
			meter = new Meter(undefined, `${serialNumber}.${i}`, ipAddress, true, Meter.type.OBVIUS, `OBVIUS ${serialNumber} COLUMN ${i}`);
			await meter.insert();
		}

		return loadArrayInput(dataRows = data[i],
							meterID = meter.id,
							mapRowToModel = rawReading => {
								const reading = rawReading[1];
								const startTimestamp = moment(rawReading[0], 'YYYY-MM-DD HH:mm:ss');
								const endTimestamp = startTimestamp.clone();
								endTimestamp.add(moment.duration(60, 'minutes'));
								return [reading, startTimestamp, endTimestamp];
							},
							isCummulative = false,
							readingRepetition = 1,
							conditionSet = undefined,
							conn = conn);
	}
}

module.exports = insertObviusData;
