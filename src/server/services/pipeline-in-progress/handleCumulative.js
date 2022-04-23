/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const day = require('day');
const { log } = require('../../log');

/**
 * Handle cumulative data, assume that last row is the first reading (skip this row).
 * @Example
 * 	row 0: reading #0 + #1 + #2
 *  row 1: reading #0 + #1
 * 	row 2: reading #0
 * => reading #1 = row 0 - row 1
 *    reading #2 = row 1 - row 2
 *    reading #0 is cumulative value from unknown readings that may or may not have been inserted before
 * @param {object[[]]} rows
 * @param readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (E-mon D-mon meters)
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {number} meterID
 */
function handleCumulative(rows, readingRepetition, cumulativeReset, meterID) {
	const result = [];
	// Initialize timestamps and other variables
	let startTimestamp = day(0);
	let endTimestamp = day(0);
	let meterReading = 0;
	let meterReading1 = 0;
	let meterReading2 = 0;

	for (let index = readingRepetition; index < rows.length; ++index) {
		// To read data where same reading is repeated. Like E-mon D-mon meters
		if ((index - readingRepetition) % readingRepetition === 0) {
			startTimestamp = day(rows[index][1], 'MM/DD/YY HH:mm');
			endTimestamp = day(rows[index - readingRepetition][2], 'MM/DD/YY HH:mm');
			// meterReading
			meterReading1 = rows[index - readingRepetition][0];
			meterReading2 = rows[index][0];
			meterReading = meterReading1 - meterReading2;
			// Reject negative readings
			if (meterReading1 < 0) {
				log.error(`DETECTED A NEGATIVE VALUE WHILE HANDLING CUMULATIVE READINGS FROM METER ${meterID}, ` +
					`ROW ${index - readingRepetition}. REJECTED ALL READINGS`);
				return [];
			}
			// To handle cumulative readings that resets at midnight
			if (meterReading < 0 && endTimestamp.isAfter(startTimestamp, 'date') && cumulativeReset) {
				meterReading = meterReading1;
			}
			// Push into reading Array
			result.push([meterReading, startTimestamp, endTimestamp]);
		}
	}
	return result;
}

module.exports = handleCumulative;
