/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const migrations = [
	require('./0.1.0-0.2.0/migrate'),
	require('./0.1.0-0.3.0/migrate'),
	require('./0.2.0-0.3.0/migrate')
];

const db = require('../models/database').db;

/**
 * This list can have cycle (also work for down migration).
 */
// const migrationList = {
// 	'0.1.0': ['0.2.0'],
// 	'0.2.0': ['0.3.0'],
// 	'0.3.0': ['0.1.0'],
// 	'0.4.0': []
// };

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

console.log(migrationList);


// const m = migrations[0];
//
// db.tx(async t => {
// 	for (const m of migrations) {
// 		await m.up(t);
// 	}
// });

module.exports = migrationList;
