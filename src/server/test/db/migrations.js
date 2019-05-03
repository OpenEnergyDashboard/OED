/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { mocha, expect, testDB } = require('../common');

const Migration = require('../../models/Migration');
const { migrateAll } = require('../../migrations/migrateDatabase');

async function clearMigrationsTable() {
	const conn = testDB.getConnection();
	// Normally, recreateDB _does_ populate the migration table;
	// that's the whole point. But, these tests require that the
	// table is in a specific state, so the records are deleted here.
	await conn.none('TRUNCATE TABLE migrations');
	await new Migration(undefined, '0.0.0', '0.100.0').insert(conn);
}

mocha.describe('Migrations', () => {
	mocha.describe('with a valid migration path', async () => {
		const versionLists = ['0.100.0-0.200.0', '0.200.0-0.300.0', '0.300.0-0.400.0',
			'0.100.0-0.400.0', '0.200.0-0.500.0'];
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
		mocha.beforeEach(clearMigrationsTable);

		mocha.it('should call correct up method for and insert new row into database', async () => {
			const conn = testDB.getConnection();
			await migrateAll('0.300.0', migrationList, conn);
			const afterCalled = [true, true, false, false, false];
			expect(isCalled).to.deep.equal(afterCalled);
			expect('0.300.0').to.equal(await Migration.getCurrentVersion(conn));
		});

		mocha.it('should find the shortest path to upgrade', async () => {
			isCalled = [false, false, false, false, false];
			const conn = testDB.getConnection();
			await migrateAll('0.400.0', migrationList, conn);
			const afterCalled = [false, false, false, true, false];
			expect(isCalled).to.deep.equal(afterCalled);
			expect('0.400.0').to.equal(await Migration.getCurrentVersion(conn));
		});
	});
	mocha.describe('with an invalid migration path', async () => {
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
		mocha.beforeEach(async () => {
			const conn = testDB.getConnection();
			await clearMigrationsTable(conn);
		});

		mocha.it('should fail because of down migration', async () => {
			expect(async () => {
				const conn = testDB.getConnection();
				await migrateAll('0.500.0', migrationList, conn)
					.to.throw(new Error('Should not downgrade, please check .js'));
			});
		});

		mocha.it('should fail because there is no path', async () => {
			const conn = testDB.getConnection();
			const list = migrationList.filter(e => e.fromVersion !== '0.3.0');
			expect(async () => {
				await migrateAll('0.500.0', list, conn)
					.to.throw(new Error('No path found'));
			});
		});

		mocha.it('should fail because there is no version in the list', async () => {
			const conn = testDB.getConnection();
			const list = migrationList.filter(e => e.fromVersion !== '0.300.0');
			expect(async () => {
				await migrateAll('0.600.0', list, conn)
					.to.throw(new Error('Did not find version in migration list'));
			});
		});

		mocha.it('should fail because the current version is the highest Version', async () => {
			const conn = testDB.getConnection();
			const list = migrationList.filter(e => e.fromVersion !== '0.300.0');
			expect(async () => {
				await migrateAll('0.100.0', list, conn)
					.to.throw(new Error('You have the highest version'));
			});
		});
	});
});

