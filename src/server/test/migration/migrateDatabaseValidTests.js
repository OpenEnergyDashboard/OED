/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;
const mocha = require('mocha');

const recreateDB = require('../db/common').recreateDB;
const db = require('../../models/database').db;

const Migration = require('../../models/Migration');
const { migrateAll } = require('../../migrations/migrateDatabase');


const versionLists = ['0.100.0-0.200.0', '0.200.0-0.300.0', '0.300.0-0.400.0', '0.100.0-0.400.0', '0.200.0-0.500.0'];
const migrationList = [];
let isCalled = [false, false, false, false, false];

// This mocks registerMigration.js
for (let i = 0; i < versionLists.length; i++) {
	const fromVersion = versionLists[i].split('-')[0];
	const toVersion = versionLists[i].split('-')[1];
	const item = {
		fromVersion,
		toVersion,
		up: async dbt => {
			// migration here
			isCalled[i] = true;
		}
	};
	migrationList.push(item);
}


mocha.describe('Migration Valid', () => {
	mocha.beforeEach(recreateDB);
	mocha.beforeEach(async () => {
		await new Migration(undefined, '0.0.0', '0.100.0').insert(db);
	});

	mocha.it('should call correct up method for and insert new row into database', async () => {
		await migrateAll('0.300.0', migrationList);
		const afterCalled = [true, true, false, false, false];
		expect(isCalled).to.deep.equal(afterCalled);
		expect('0.300.0').to.equal(await Migration.getCurrentVersion());
	});

	mocha.it('should find the shortest path to upgrade', async () => {
		isCalled = [false, false, false, false, false];
		await migrateAll('0.400.0', migrationList);
		const afterCalled = [false, false, false, true, false];
		expect(isCalled).to.deep.equal(afterCalled);
		expect('0.400.0').to.equal(await Migration.getCurrentVersion());
	});
});
