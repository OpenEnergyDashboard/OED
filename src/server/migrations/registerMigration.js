/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This list can have cycle (also work for down migration).
 */
const migrationList = {
	'0.1.0': ['0.2.0'],
	'0.2.0': ['0.3.0'],
	'0.3.0': ['0.1.0'],
	'0.4.0': []
};

module.exports = migrationList;
