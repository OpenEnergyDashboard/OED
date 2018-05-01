/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const csv = require('csv');
 const promisify = require('es6-promisify');
 const parseCsv = promisify(csv.parse);

/**
 * Demultiplexes a CSV file with a single column of timestamps and multiple columns
 * of data, into multiple arrays of [timestamp, datapoint] tuples.
 * @param {string} input 
 * @param {number} timesColumn 
 */
async function demuxCsvWithSingleColumnTimestamps(input, timesColumn=0) {
	data = await parseCsv(input);

	// Create output array with the appropriate number of columns
	// and filled with empty arrays.
	const output = [...Array(data[0].length - 1)].map(x=>[]);

	for (let r = 0; r < data.length; r++) {
		const row = data[r];
		const time = row[timesColumn];
		for (let col = 0; col < row.length; col++) {
			// Set the adjusted column number (skipping the times column)
			let adjCol;
			if (col < timesColumn) {
				adjCol = col;
			} else if (col == timesColumn) {
				continue
			} else {
				adjCol = col - 1;
			}
			output[adjCol][r] = [time, Number.parseFloat(row[col])];
		}
	}
	return output
}

module.exports = {demuxCsvWithSingleColumnTimestamps};
