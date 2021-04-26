/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');
const { log } = require('../log');
const { insertMetersWrapper } = require('./readMamacMeters');
const { getConnection } = require('../db');

// Script to add meters from a .xlsx file
// The first two elements are 'node' and the name of the file. We only want arguments passed to it.
(async () => {
	const args = process.argv.slice(2);
	if (args.length !== 1) {
		log.error(`Expected one argument (path to csv file of meter ips), but got ${args.length} instead`, 'error');
	} else {
		const absolutePath = path.resolve(args[0]);
		log.info(`Importing meters from ${absolutePath}`);
		const conn = getConnection();
		try {
			const errors = await insertMetersWrapper(absolutePath, conn);
		} catch (errors) {
			for (const err of errors) {
				log.error(`Error inserting meters: ${err}`, err);
			}
		} finally {
			log.info('Done inserting meters');
		}
	}
})();

