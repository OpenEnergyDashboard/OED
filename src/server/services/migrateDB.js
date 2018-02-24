/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const readline = require('readline');
const Migration = require('../models/Migration');
const { log } = require('../log');
const { compare } = require('../util');
const { migrateAll } = require('../migrations/migrateDatabase');
const migrationList = require('../migrations/registerMigration').migrations;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Verifies that an toVersion is good
function checkVersion(toVersion) {
	const currentVersion = Migration.getCurrentVersion();
	return compare(currentVersion, toVersion) === -1;
}

// Asks the user for an e-mail.
function askToVersion() {
	return new Promise((resolve, reject) => {
		rl.question('To Version: ', toVersion => {
			if (checkVersion(toVersion)) {
				resolve(toVersion);
			} else {
				reject(toVersion);
			}
		});
	});
}

function terminateReadline(message) {
	if (message) log.info(message);
	rl.close();
	process.exit(0);
}

(async () => {
	let toVersion;

	// If there aren't enough args, go interactive.
	const cmdArgs = process.argv;
	if (cmdArgs.length !== 4) {
		let toVersionResult;
		try {
			toVersionResult = await askToVersion();
		} catch (err) {
			terminateReadline('Invalid toVersion, no migration succeeded');
		}
		toVersion = await askToVersion();
	} else {
		toVersion = cmdArgs[2];

		if (!checkVersion(toVersion)) {
			terminateReadline('Invalid toVersion, no migration succeeded');
		}
	}

	try {
		await migrateAll(toVersion, migrationList);
		terminateReadline('Migration successful');
	} catch (err) {
		log.error(`Error while migrating database: ${err}`, err);
		terminateReadline('Migration failed');
	}
})();
