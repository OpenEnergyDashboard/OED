/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const mocha = require('mocha');

const Migration = require('../../models/Migration');

const recreateDB = require('../db/common').recreateDB;
const db = require('../../models/database').db;
const { migrateAll } = require('../../migrations/migrateDatabase');

const mock = require('mock-require');

const versionLists = ['0.1.0-0.2.0', '0.2.0-0.3.0', '0.3.0-0.1.0', '0.1.0-0.4.0'];

const migrationList = [];

const isCalled = [false, false, false, false];

// This mocks registerMigration.js
for (let i = 0; i < versionLists.length; i++) {
	const array = versionLists[i].split('-');
	const fromVersion = array[0];
	const toVersion = array[1];
	const item = {
		fromVersion: fromVersion,
		toVersion: toVersion,
		up: async dbt => {
			// migration here
			console.log('called');
			isCalled[i] = true;
		}
	};
	migrationList.push(item);
}

console.log(migrationList);

// (async () => {
// 	await migrateAll('0.3.0', migrationList);
// 	// check things here
// })(); // call the async fn here
migrateAll('0.3.0', migrationList);

console.log(isCalled);


// console.log(isCalled);
// let m1Called = false;
//
// let m = {
// 	fromVersion: '0.1',
// 	toVersion: '0.2',
// 	up: db => {
// 		m1Called = true;
// 	}
// };
//
// mocha.describe('Migrate the database from current to new version', () => {
// 	mocha.beforeEach(recreateDB);
// 	// Add a first migration
// 	// mocha.beforeEach(async () => {
// 	// 	await new Migration(undefined, '0.0.0', '0.1.0').insert();
// 	// });
//
// 	mocha.it('should show correct correct up method for each migration in list and insert new row into database', async () => {
// 		migrateAll('0.3.0', migrationList);
// 		const afterCalled = [true, true, false, false];
// 		expect(isCalled).to.equal(afterCalled);
// 		// const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
// 		// await readMetasysData(testFilePath, 60, 2, false);
// 		// const {count} = await db.one('SELECT COUNT(*) as count FROM readings');
// 		// expect(parseInt(count)).to.equal(37);
// 	});
//
// 	// mocha.it('should fail because there is no path', async () => {
// 	// 	// const testFilePath = path.join(__dirname, 'data', 'metasys-duplicate.csv');
// 	// 	// await readMetasysData(testFilePath, 60, 2, true);
// 	// 	// const {reading} = await db.one('SELECT reading FROM readings LIMIT 1');
// 	// 	// expect(parseInt(reading)).to.equal(280);
// 	// });
//
// });

