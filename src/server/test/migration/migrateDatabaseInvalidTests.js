/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;
const mocha = require('mocha');

const testDB = require('../db/common').testDB;

const Migration = require('../../models/Migration');
const { migrateAll } = require('../../migrations/migrateDatabase');


const versionLists = ['0.100.0-0.200.0', '0.200.0-0.300.0', '0.300.0-0.100.0', '0.100.0-0.400.0', '0.200.1-0.500.0'];
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
		await new Migration(undefined, '0.0.0', '0.100.0').insert(conn);
	});

	mocha.it('should fail because of down migration', async () => {
		const conn = testDB.getConnection();
		await expect(migrateAll('0.500.0', migrationList, conn))
			.to.be.rejectedWith('Migration fromVersion 0.300.0 is more recent than toVersion 0.100.0');
	});

	mocha.it('should fail because there is no path', async () => {
		const conn = testDB.getConnection();
		const list = migrationList.filter(e => e.fromVersion !== '0.300.0');
		await expect(migrateAll('0.500.0', list, conn))
			.to.be.rejectedWith('No path found');
	});

	mocha.it('should fail because there is no version in the list', async () => {
		const list = migrationList.filter(e => e.fromVersion !== '0.300.0');
		await expect(migrateAll('0.600.0', list, conn))
				.to.be.rejectedWith('Could not find version 0.600.0 from the registered migration list');
	});

	mocha.it('should fail because the current version is the highest Version', async () => {
		const list = migrationList.filter(e => e.fromVersion !== '0.300.0');
		await expect(migrateAll('0.100.0', list, conn))
				.to.be.rejectedWith('You have the highest version');
	});
});
