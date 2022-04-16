/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const crypto = require('crypto');
const { CSVPipelineError } = require('./CustomErrors');
const fs = require('fs').promises;

async function saveCsv(buffer, filename, dir=__dirname) {
	// save this buffer into a file
	const randomFilename = `${filename}-${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')}-${crypto.randomBytes(2).toString('hex')}`;
	const filepath = `${dir}/${randomFilename}.csv`;
	await fs.writeFile(filepath, buffer)
		.catch(err => {
			const message = `Failed to write the file: ${filepath}`;
			throw new CSVPipelineError(`Internal OED error: ${message}`, err.message, 500);
		}); // separate logs function that logs for error message, 1. log it, 2. passback error codes to user, 3. stop process; 
	return filepath;
}

module.exports = saveCsv;
