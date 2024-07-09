/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chunk = require('lodash/chunk');
const moment = require('moment');

function threeDHoleAlgorithm(meterOrGroupReadings, fromTimestamp, toTimestamp) {
	// Initialize empty plotly data 
	const xData = [];
	const yData = [];
	const zData = [];

	const numOfReadings = meterOrGroupReadings.length;
	// If readings exist, and first index is not the 'special case'(requested frequency exceeds meter reading frequency)
	// find/replace missing readings if any, and format for plotly,
	// Otherwise, return empty x,y,z data
	if (numOfReadings > 0) {
		// If the meter is low frequency then the DB may return readings with larger time ranges than requested.
		// All readings have same range so use the first one to determine the range. diff gives milliseconds
		// so divide by 1000 to sec and 3600 to hours.
		// Note the returned points per day might be less than requested but still stored in the requested number in
		// Redux state. This is not common so just do that since much easier.
		const readingIntervalUse = meterOrGroupReadings[0].end_timestamp.diff(meterOrGroupReadings[0].start_timestamp) / 3600000;
		// Assume no missing readings, replace if needed.
		let readingsToReturn = meterOrGroupReadings;

		// get the number of days between start and end timestamps * readings per day.
		const readingsPerDay = 24 / readingIntervalUse;
		const intervalDuration = moment.duration({ 'hour': readingIntervalUse });
		const expectedNumOfReadings = toTimestamp.diff(fromTimestamp, 'days') * readingsPerDay;
		// Run Fill holes algorithm if expected num of readings do not match received reading count.
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

		// In rare cases, there's a chance that readings per day returns a fraction (eg. 0.25 when meter reads @ 4 day intervals) which breaks chunk()
		const chunkSize = readingsPerDay >= 1 ? readingsPerDay : 1;

		// Create 2D array by chunking, each 'chunk' corresponds to a day's worth of readings.
		const chunkedReadings = chunk(readingsToReturn, chunkSize);

		// Format xData and yData  for plotly
		chunkedReadings.forEach((day, i) => {
			// Populate xData hourly timestamp intervals from the first day only.
			if (i === 0) {
				day.forEach(hour => xData.push(
					{
						startTimestamp: hour.start_timestamp.valueOf(),
						endTimestamp: hour.end_timestamp.valueOf()
					}
				))
			}

			// Populate yData based on first index of each day
			yData.push(day[0].start_timestamp.valueOf());

			// Populate a zData row then append to the zData 2D Array
			zData.push(day.map(hour => hour.reading_rate));
		})
	}

	//return in a format the frontend is expecting.
	return { xData: xData, yData: yData, zData: zData };
}

module.exports = { threeDHoleAlgorithm };
