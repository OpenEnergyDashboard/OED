/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');

const Migration = require('../../models/Migration');
const { migrateAll } = require('../../migrations/migrateDatabase');
const VERSION = require('../../version');

// Puts the parts of the semantic version together separated by period.
function getVersion(major, minor, patch) {
	return (major + '.' + minor + '.' + patch);
}

// The current version of OED.
const startMajor = Number(VERSION.major);
const startMinor = Number(VERSION.minor);
const startPatch = Number(VERSION.patch);
// The possible migrations to use in testing.
// They all displace from the current version so they work even when the OED version changes.
const versionLists = [
	// Valid from above the current version to the next one.
	getVersion(startMajor, startMinor + 100, startPatch) + '-' + getVersion(startMajor, startMinor + 200, startPatch),
	// Valid for the next version migration.
	getVersion(startMajor, startMinor + 200, startPatch) + '-' + getVersion(startMajor, startMinor + 300, startPatch),
	// Invalid since goes backwards from the last 1 above.
	getVersion(startMajor, startMinor + 300, startPatch) + '-' + getVersion(startMajor, startMinor + 100, startPatch),
	// Valid from the first one after current to a higher one that is different.
	getVersion(startMajor, startMinor + 100, startPatch) + '-' + getVersion(startMajor, startMinor + 400, startPatch),
	// Valid from the second one after current to a higher one that is different.
	// Note increase the patch version so you cannot get to the final version in this migration from the current version.
	getVersion(startMajor, startMinor + 200, startPatch + 1) + '-' + getVersion(startMajor, startMinor + 500, startPatch),
]
const migrationList = [];
const called = [false, false, false, false, false];

// This mocks registerMigration.js
for (let i = 0; i < versionLists.length; i++) {
	const fromVersion = versionLists[i].split('-')[0];
	const toVersion = versionLists[i].split('-')[1];
	const item = {
		fromVersion,
		toVersion,
		up: async dbt => {
			// migration here
			called[i] = true;
		}
	};
	migrationList.push(item);
}

mocha.describe('Migration Invalid', () => {
	mocha.beforeEach(async () => {
		const conn = testDB.getConnection();
		// Add migration from the current version to the first one above for migrations.
		await new Migration(undefined, getVersion(startMajor, startMinor, startPatch),
			getVersion(startMajor, startMinor + 100, startPatch)).insert(conn);
	});

	mocha.it('should fail because of down migration', async () => {
		const conn = testDB.getConnection();
		await expect(migrateAll(getVersion(startMajor, startMinor + 500, startPatch), migrationList, conn))
			.to.be.rejectedWith('Migration fromVersion ' + getVersion(startMajor, startMinor + 300, startPatch) +
				' is more recent than toVersion 1.100.0');
	});

	mocha.it('should fail because there is no path', async () => {
		const conn = testDB.getConnection();
		// Get rid of the invalid conversion so all OK.
		const list = migrationList.filter(e => e.fromVersion !== getVersion(startMajor, startMinor + 300, startPatch));
		await expect(migrateAll(getVersion(startMajor, startMinor + 500, startPatch), list, conn))
			.to.be.rejectedWith('No path found');
	});

	mocha.it('should fail because there is no version in the list', async () => {
		// Get rid of the invalid conversion so all OK.
		const list = migrationList.filter(e => e.fromVersion !== getVersion(startMajor, startMinor + 300, startPatch));
		await expect(migrateAll(getVersion(startMajor, startMinor + 600, startPatch), list, conn))
			.to.be.rejectedWith('Could not find version 1.600.0 from the registered migration list');
	});

	mocha.it('should fail because the current version is the highest Version', async () => {
		// Get rid of the invalid conversion so all OK.
		const list = migrationList.filter(e => e.fromVersion !== getVersion(startMajor, startMinor + 300, startPatch));
		await expect(migrateAll('1.100.0', list, conn))
			.to.be.rejectedWith('You have the highest version');
	});
});
