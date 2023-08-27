/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const _ = require('lodash');
const moment = require('moment');

function threeDHoleAlgorithm(meterOrGroupReadings, fromTimestamp, toTimestamp, readingInterval) {
	// Initialize empty plotly data 
	const xData = [];
	const yData = [];
	const zData = [];

	const numOfReadings = meterOrGroupReadings.length;
	// If readings exist, find/replace missing readings if any, and format for plotly.
	// Otherwise, return empty z,y,z data
	if (numOfReadings > 0) {
		// Assume no missing readings, replace if needed.
		let readingsToReturn = meterOrGroupReadings;

		// get the number of days days between start and end timestamps * readings per day.
		const readingsPerDay = 24 / readingInterval;
		const intervalDuration = moment.duration({ 'hour': readingInterval });
		const expectedNumOfReadings = toTimestamp && fromTimestamp ? toTimestamp.diff(fromTimestamp, 'days') * readingsPerDay : -1;
		// Run Fill holes algorithm if expected num of readings to not match received reading count.
		if (meterOrGroupReadings.length !== expectedNumOfReadings) {
			const missingReadings = [];

			meterOrGroupReadings.forEach((reading, index, arr) => {
				// The two values to compare, Current and next readings.
				const currentReading = reading;
				const nextReading = arr[index + 1];
				// If a next exists, and current / next timestamps aren't equal, fill the gap with null readings.
				if (nextReading && !currentReading.end_timestamp.isSame(nextReading.start_timestamp)) {

					// our null iteration target timestamp (push null until target reached.)
					const targetStartTimestamp = nextReading.start_timestamp;

					// set next timestamp to equal with current endTS 
					let nextStartTimeStamp = currentReading.end_timestamp.clone();
					// gap to fill.
					let nextEndTimeStamp = nextStartTimeStamp.clone().add(intervalDuration);

					// Push missing null readings until the readings are equal
					// do-while; a reading is missing, therefore must be executed at least once.
					do {
						missingReadings.push({
							reading_rate: null,
							start_timestamp: nextStartTimeStamp,
							end_timestamp: nextEndTimeStamp
						})

						// To make the readings equal, next start time is current end time
						nextStartTimeStamp = nextEndTimeStamp.clone();
						nextEndTimeStamp = nextStartTimeStamp.clone().add(intervalDuration);

						// if nextStartTS and targetStartTS are equal, all gaps have been filled; break
					} while (!nextStartTimeStamp.isSame(targetStartTimestamp));
				}
			});

			// Merge the Original Readings with 'hole' readings.
			let merged = [];
			// While both arrays have values compare and push. Since both arrays are individually sorted, you can compare the first indexes of each
			while (meterOrGroupReadings.length && missingReadings.length) {
				// array.shift() works similarly to dequeue() in that it pops off the front of the array
				if (meterOrGroupReadings[0].start_timestamp.valueOf() < missingReadings[0].start_timestamp.valueOf()) {
					merged.push(meterOrGroupReadings.shift());
				} else {
					merged.push(missingReadings.shift());
				}
			}
			// Push remaining values, if any
			while (meterOrGroupReadings.length) {
				merged.push(meterOrGroupReadings.shift());
			}
			// Push remaining values, if any
			while (missingReadings.length) {
				merged.push(missingReadings.shift());
			}

			// Update the values to be formatted and returned.
			readingsToReturn = merged;
		}

		// Format readings.
		// Create 2D array by chunking, each 'chunk' corresponds to a day's worth of readings.
		const chunkedReadings = _.chunk(readingsToReturn, readingsPerDay);
		// This variable corresponds to the first day's readings, to get the hourly timestamps for xData.
		const chunkedReadingsHour = _.cloneDeep(chunkedReadings[0]);

		// get the hourly timestamp intervals from
		chunkedReadingsHour.forEach(hour => xData.push(hour.start_timestamp.add(hour.end_timestamp.diff(hour.start_timestamp) / 2).valueOf()));
		chunkedReadings.forEach(day => {
			let dayReadings = [];
			yData.push(day[0].start_timestamp.valueOf());

			day.forEach(hour => dayReadings.push(hour.reading_rate));
			zData.push(dayReadings);
		})
	}

	//return in a format the frontend is expecting.
	return { xData: xData, yData: yData, zData: zData };
}

module.exports = { threeDHoleAlgorithm };