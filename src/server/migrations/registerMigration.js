/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * register migration here
 */
const migrations = [
	require('./0.1.0-0.2.0/migrate'),
	// require('./0.1.0-0.3.0/migrate'),
	require('./0.2.0-0.3.0/migrate'),
	require('./0.3.0-0.1.0/migrate'),
	require('./0.5.0-0.6.0/migrate')
];

/**
 * create an adjacency list of the migrations
 * @returns {{}} object in adjacency list style
 */
function createMigrationList() {
	const migrationList = {};

	const vertex = [];

	for (const m of migrations) {
		vertex.push(m.fromVersion);
		vertex.push(m.toVersion);
	}

	const uniqueKey = [...new Set(vertex)];

	uniqueKey.forEach(key => {
		migrationList[key] = [];
	});

	for (const m of migrations) {
		migrationList[m.fromVersion].push(m.toVersion);
	}

	return migrationList;
}
console.log(createMigrationList());
module.exports = createMigrationList();
