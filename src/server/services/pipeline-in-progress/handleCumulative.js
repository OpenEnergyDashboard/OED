/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');

/**
 * Handle cumulative data, assume that last row is the first reading (skip this row).
 * @Example
 * 	row 0: reading #0 + #1 + #2
 *  row 1: reading #0 + #1
 * 	row 2: reading #0
 * => reading #1 = row 0 - row 1
 *    reading #2 = row 1 - row 2
 *    reading #0 is cumulative value from unknown readings that may or may not have been inserted before
 * @param {2d array} rows
 * @param readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (E-mon D-mon meters)
 */
function handleCumulative(rows, readingRepetition) {
	const result = [];
	// Initialize timestamps and other variables
	let startTimestamp = moment(0);
	let endTimestamp = moment(0);
	let meterReading = 0;
	let meterReading1 = 0;
	let meterReading2 = 0;

	for (let index = readingRepetition; index < rows.length; ++index) {
		// To read data where same reading is repeated. Like E-mon D-mon meters
		if ((index - readingRepetition) % readingRepetition === 0) {
			// set start_timestamp and end_timestamp
			startTimestamp = moment(rows[index][1], 'MM/DD/YY HH:mm');
			endTimestamp = moment(rows[index - readingRepetition][2], 'MM/DD/YY HH:mm');
			// meterReading
			meterReading1 = rows[index - readingRepetition][0];
			meterReading2 = rows[index][0];
			meterReading = meterReading1 - meterReading2;
			// To handle cumulative readings that resets at midnight
			if (meterReading < 0) {
				meterReading = meterReading1;
			}
			// push into reading Array
			result.push([meterReading, startTimestamp, endTimestamp]);
		}
	}
	return result;
}

module.exports = handleCumulative;
