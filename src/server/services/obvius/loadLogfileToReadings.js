/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const Meter = require('../../models/Meter');
const loadArrayInput = require('../pipeline-in-progress/loadArrayInput');
const { log } = require('../../log');
const demuxCsvWithSingleColumnTimestamps = require('./csvDemux');
const Preferences = require('../../models/Preferences');

async function loadLogfileToReadings(serialNumber, ipAddress, logfile, conn) {
	// Get demultiplexed, parsed data from the CSV.
	const unprocessedData = await demuxCsvWithSingleColumnTimestamps(logfile);
	// Removes the first three values because we expect it to be all zeroes
	const data = unprocessedData.slice(3);
	for (let i = 0; i < data.length; i++) {
		let meter;
		try {
			meter = await Meter.getByName(`${serialNumber}.${i}`, conn);
		} catch (v) {
			const preferences = await Preferences.get(conn);
			// For now, new Obvius meters collect data (enabled) but do not display (not displayable).
			// Also, the identifier is similar to the meter name for now.
			// end only time is true for Obvius meters.
			// Data was sent for a meter that did not have a config file sent before this.
			// As a result, we cannot know the unit so make unknown for now.
			// The admin need to set the unit before making it displayable or it cannot be graphed.
			meter = new Meter(
				undefined, // id
				`${serialNumber}.${i}`, // name
				ipAddress, // URL
				true, // enabled
				false, // displayable
				Meter.type.OBVIUS, // type
				null, //timezone
				undefined, // gps
				`OBVIUS ${serialNumber} COLUMN ${i}`, // identifier
				'created via obvius log upload on ' + moment().format(), // note
				undefined, // area
				undefined, // cumulative
				undefined, //cumulativeReset
				undefined, // cumulativeResetStart
				undefined, // cumulativeResetEnd
				preferences.defaultMeterReadingGap, // readingGap
				undefined, // readingVariation
				undefined, //readingDuplication
				undefined, // timeSort
				true, // endOnlyTime
				undefined, // reading
				undefined, // startTimestamp
				undefined, // endTimestamp
				undefined, // previousEnd
				undefined, // unit
				undefined, // default graphic unit
				undefined, // area unit
				preferences.defaultMeterReadingFrequency, // reading frequency
				preferences.defaultMeterMinimumValue, // minVal
				preferences.defaultMeterMaximumValue, // maxVal
				preferences.defaultMeterMinimumDate, // minDate
				preferences.defaultMeterMaximumDate, // maxDate
				preferences.defaultMeterMaximumErrors, // maxError
				preferences.defaultMeterDisableChecks  // disableChecks
			);
			await meter.insert(conn);
			log.warn('WARNING: Created a meter (' + `${serialNumber}.${i}` +
				') that does not already exist. Normally obvius meters created by an uploaded ConfigFile.');
		}

		let reading = [];
		let index = 0;
		for (const rawReading of data[i]) {
			// If the reading is invalid, throw it out.
			// Since this does not go to the pipeline the meter dates stay the same so this does not count as
			// a new date. Probably the right thing to do but could lead to messages on later uploads.
			if (rawReading[1] === null) {
				continue;
			}
			// Otherwise assume it is kWh and proceed.
			// Assume one reading is end time.
			// moment cannot be set to strict mode since it fails. However, the expected format is given so
			// it should do a good test.
			// See src/server/services/pipeline-in-progress/processData.js for more info on why it is set up this way.
			// It would seem you could directly use the rawReading[0] since it is in the right format but doing that leads
			// to errors so we parse in the usual way.
			const endTimestamp = moment.parseZone(moment(rawReading[0], 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') + '+00:00', undefined, true);
			reading[index] = [rawReading[1], endTimestamp];
			index++;
		}
		try {
			// Ignoring that loadArrayInput returns values
			// since this is only called by an automated process at this time.
			// Issues from the pipeline will be logged by called functions.
			await loadArrayInput(dataRows = reading,
				meterID = meter.id,
				mapRowToModel = row => {
					const readRate = row[0];
					// Unusual name to avoid shadow name.
					const endTimestampParam = row[1];
					return [readRate, endTimestampParam];
				},
				// For the next set of values we don't get from Obvius so use meter defaults.
				timeSort = meter.timeSort,
				readingRepetition = meter.readingDuplication,
				isCumulative = meter.cumulative,
				cumulativeReset = meter.cumulativeReset,
				cumulativeResetStart = meter.cumulativeResetStart,
				cumulativeResetEnd = meter.cumulativeResetEnd,
				readingGap = meter.readingGap,
				readingLengthVariation = meter.readingVariation,
				// Obvius meters have endOnlyTime true by default.
				isEndOnly = meter.endOnlyTime,
				// Unsure if previous values should not change but going to assume want the latest one sent.
				shouldUpdate = true,
				conditionSet = {
					minVal: meter.minVal,
					maxVal: meter.maxVal,
					minDate: meter.minDate,
					maxDate: meter.maxDate,
					threshold: readingGap,
					maxError: meter.maxError,
					disableChecks: meter.disableChecks
				},
				conn = conn,
				honorDst = false,
				relaxedParsing = false,
				useMeterZone = false
			);
		} catch (err) {
			log.error('Could not insert readings from Obvius logfile.', err);
		}
	}
}

module.exports = loadLogfileToReadings;
