/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const loadArrayInput = require('../pipeline-in-progress/loadArrayInput');
const { log } = require('../../log');
const demuxCsvWithSingleColumnTimestamps = require('./csvDemux');

async function loadLogfileToReadings(serialNumber, ipAddress, logfile, conn) {
	// Get demultiplexed, parsed data from the CSV.
	const unprocessedData = demuxCsvWithSingleColumnTimestamps(logfile);
	// Removes the first three values because we expect it to be all zeroes
	const data = unprocessedData.slice(3);
	for (let i = 0; i < data.length; i++) {
		let meter;
		try {
			meter = await Meter.getByName(`${serialNumber}.${i}`, conn);
		} catch (v) {
			// For now, new Obvius meters collect data (enabled) but do not display (not displayable).
			// Also, the identifier is the same as the meter name for now. The longer-term plan is to read
			// the configuration file and use information in that to set this value before meters are read
			// so they are not created here.
			// TODO get meter to have end only as true.
			meter = new Meter(undefined, `${serialNumber}.${i}`, ipAddress, true, false, Meter.type.OBVIUS, null);
			await meter.insert(conn);
			log.warn('WARNING: Created a meter (' + `${serialNumber}.${i}` +
				')that does not already exist. Normally obvius meters created by an uploaded ConfigFile.');
		}

		for (const rawReading of data[i]) {
			// If the reading is invalid, throw it out.
			// Since this does not go to the pipeline the meter dates stay the same so this does not count as
			// a new date. Probably the right thing to do but could lead to messages on later uploads.
			if (rawReading[1] === null) {
				continue;
			}
			// Otherwise assume it is kWh and proceed.
			// Switching to assume one reading is end time and can use default moment parsing of date/timestamp.
			// TODO if need format here then reconsider mamac/pipeline setup
			const endTimestamp = moment(rawReading[0], 'YYYY-MM-DD HH:mm:ss');
			// const reading = new Reading(meter.id, rawReading[1], startTimestamp, endTimestamp);
			reading = [[rawReading[1], endTimestamp]];
			// TODO deal with any errors
			try {
				// TODO should batch up all readings in array in similar way to Mamac.
				await loadArrayInput(dataRows = reading,
					meterID = meter.id,
					mapRowToModel = row => {
						const readRate = row[0];
						const endTimestamp = row[1];
						return [readRate, endTimestamp];
					},
					// TODO Switch these to meter value.
					timeSort = 'increasing',
					readingRepetition = 1,
					isCumulative = false,
					cumulativeReset = false,
					// No cumulative reset so dummy times.
					cumulativeResetStart = '0:00:00',
					cumulativeResetEnd = '0:00:00',
					// Every reading should be adjacent (no gap)
					readingGap = 0,
					// Every reading should be the same length
					readingLengthVariation = 0,
					isEndOnly = true,
					conditionSet = undefined,
					conn = conn
				);
				// await reading.insertOrIgnore(conn);
			} catch (err) {
				log.error('Could not insert readings from Obvius logfile.', err);
			}
		}
	}
}

module.exports = loadLogfileToReadings;
