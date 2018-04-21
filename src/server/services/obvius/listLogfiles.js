/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Logfile = require('../../models/obvius/Logfile');

async function listLogfiles() {
	// List all log files we have received and fully processed.
	const allLogfiles = await Logfile.getAll();
	let response = '';
	for (f of allLogfiles) {
		if (f.processed) {
			response += `CONFIGFILE,${f.makeFilename()},${f.hash},${f.created.format('YYYY-MM-DD hh:mm:ss')}\n`;
		}
	}
	return response;
}

module.exports = listLogfiles;