/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Configfile = require('../../models/obvius/Configfile');

/**
 * Generates and returns an Obvius config manifest format list of all known config files.
 * @param conn The connection to use.
 * @returns {string}
 */
async function listConfigfiles(conn) {
	// List all log files we have received and fully processed.
	const allConfigfiles = await Configfile.getAll(conn);
	let response = '';
	for (f of allConfigfiles) {
		if (f.processed) {
			response += `CONFIGFILE,${f.makeFilename()},${f.hash},${f.created.format('YYYY-MM-DD hh:mm:ss')}\n`;
		}
	}
	return response;
}

module.exports = listConfigfiles;
