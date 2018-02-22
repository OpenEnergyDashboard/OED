/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * register migration here. It allows for down migration however NOT RECOMMENDED
 */
const migrations = [
	require('./0.1.0-0.2.0/migrate'),
	// require('./0.1.0-0.3.0/migrate'),
	require('./0.2.0-0.3.0/migrate'),
	require('./0.3.0-0.1.0/migrate'),
	require('./0.5.0-0.6.0/migrate')
];

module.exports = migrations;
