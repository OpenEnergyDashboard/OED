/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { log } = require('../log');
const WEBSITE_URL = process.argv[2];

async function checkWebsite() {
	try {
		const response = await fetch(WEBSITE_URL, { method: 'HEAD' });

		if (!response.ok) {
			const errorMessage = `The server at ${WEBSITE_URL} is down.`;
			// Log the error using Logger class
			log.error(errorMessage);
		}
	} catch (error) {
		const errorMessage = `Failed to reach ${WEBSITE_URL}. Error: ${error.message}`;
		log.error(errorMessage, error);
	}
}

checkWebsite();
