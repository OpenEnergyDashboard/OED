const readline = require('readline');


function ask(question, condition = true) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve, reject) => {
		rl.question(question, response  => {
			if (condition(response)) {
				resolve(response);
			} else {
				reject(response);
			}
		});
	})
}

function validate(text) {
	if (text === 'yeah') {
		return true;
	} else {
		return false;
	}
}

(async () => {
	const ans = await ask('What do you want?', validate);
	console.log(ans);
})();

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { log } = require('../log');
const { ask, terminateReadline } = require('./servicesUtils');
const { findMaxSemanticVersion } = require('../util');
const { printMigrationList, migrateAll, getUniqueKeyOfMigrationList } = require('../migrations/migrateDatabase');
const migrationList = require('../migrations/registerMigration');

function findMaxVersion(list) {
	return findMaxSemanticVersion(getUniqueKeyOfMigrationList(list));
}

(async () => {
	let toVersion;
	try {
		const updateMax = await ask('Do you want to update to the max version? [yes/no]: ');
		if (updateMax.toLowerCase() === 'yes' || updateMax.toLowerCase() === 'y') {
			toVersion = await findMaxVersion(migrationList);
		} else if (updateMax.toLowerCase() === 'no' || updateMax.toLowerCase() === 'n') {
			toVersion = await ask('To Version');
		}
	} catch (err) {
		terminateReadline('Invalid arguments, please enter [yes/no]');
	}
	try {
		await migrateAll(toVersion, migrationList);
		terminateReadline('Migration successful');
	} catch (err) {
		log.error(`Error while migrating database: ${err}`, err);
		log.info('Possible migrations: \n', printMigrationList(migrationList));
		terminateReadline('Migration failed');
	}
})();
