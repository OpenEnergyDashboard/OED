/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');
const fs = require('fs').promises;
const csv = require('csv');

const parseCsv = util.promisify(csv.parse);

/**
 * Returns a promise to read the given CSV file into an array of arrays.
 * @param fileName the filename to read
 * @return {Promise.<array.<array>>}
 */
async function readCsv(fileName) {
	const buffer = await fs.readFile(fileName);
	return await parseCsv(buffer.toString());
}

module.exports = readCsv;
