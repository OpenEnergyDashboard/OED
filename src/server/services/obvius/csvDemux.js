/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const parseCsv = require('csv-parse/lib/sync');

/**
 * Demultiplexes a CSV file with a single column of timestamps and multiple columns
 * of data, into multiple arrays of [timestamp, datapoint] tuples.
 *
 * Nonexistant entries are replaced with nulls.
 * @param {string} input
 * @param {number} timesColumn
 */
function demuxCsvWithSingleColumnTimestamps(input, timesColumn = 0) {
	data = parseCsv(input, {relax_column_count: true});

	const maxCol = data.reduce((t, c) => {
		if (c.length > t) {
			return c.length;
		} else {
			return t;
		}
	}, 0);

	// Create output array with the appropriate number of columns
	// and filled with empty arrays.
	const output = [...Array(maxCol - 1)].map(x => []);

	for (let r = 0; r < data.length; r++) {
		const row = data[r];
		const time = row[timesColumn];
		for (let col = 0; col < maxCol; col++) {
			// Set the adjusted column number (skipping the times column)
			let adjCol;
			if (col < timesColumn) {
				adjCol = col;
			} else if (col === timesColumn) {
				continue;
			} else {
				adjCol = col - 1;
			}
			let value = Number.parseFloat(row[col]);
			if (Number.isNaN(value)) {
				value = null;
			}
			output[adjCol][r] = [time, value];
		}
	}
	return output;
}

module.exports = demuxCsvWithSingleColumnTimestamps;
