/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');
const csv = require('csv');
const fs = require('fs').promises;

const parseCsv = util.promisify(csv.parse);

/**
 * Returns a promise to read the given CSV file into an array of arrays.
 * @param fileName the filename to read from
 * @param headerRow true if file has a header row
 * @return {Promise.<array.<array>>}
 */
async function readCsv(fileName, headerRow) {
	const buffer = await fs.readFile(fileName);
	if (headerRow) {
		// For now we ignore the header row by starting the parse on line 2.
		// If we ever allow the rearrange based on header row name then this
		// needs to be fixed up. If hard here could look at csv-parser instead
		// of csv-parse.
		return await parseCsv(buffer.toString(), { from_line: 2 });
	} else {
		return await parseCsv(buffer.toString());
	}
}

module.exports = readCsv;
