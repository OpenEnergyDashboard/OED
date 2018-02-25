/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const readline = require('readline');
const { log } = require('../log');
const { findMaxSemanticVersion } = require('../util');
const { migrateAll, getUniqueKeyOfMigrationList } = require('../migrations/migrateDatabase');
const migrationList = require('../migrations/registerMigration');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function findMaxSematicVersion(list) {
	return findMaxSemanticVersion(getUniqueKeyOfMigrationList(list));
}

function askUpdateToMax() {
	return new Promise((resolve, reject) => {
		rl.question('Do you want to update to the max version? [yes/no]: ', answer => {
			if (answer === 'yes' || answer === 'no') {
				resolve(answer);
			} else {
				reject(answer);
			}
		});
	});
}

function askToVersion() {
	return new Promise(resolve => {
		rl.question('To Version: ', toVersion => {
			resolve(toVersion);
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
	try {
		const updateMax = await askUpdateToMax();
		if (updateMax === 'yes') {
			toVersion = await findMaxSematicVersion(migrationList);
		} else if (updateMax === 'no') {
			toVersion = await askToVersion();
		}
	} catch (err) {
		console.log(err);
		terminateReadline('Invalid arguments, please enter [yes/no]');
	}
	try {
		console.log(toVersion);
		await migrateAll(toVersion, migrationList);
		terminateReadline('Migration successful');
	} catch (err) {
		log.error(`Error while migrating database: ${err}`, err);
		terminateReadline('Migration failed');
	}
})();
