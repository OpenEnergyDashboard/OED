/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Register migration here
 */
const migrations = [
	/* eslint-disable global-require */
	//require('./0.2.0-0.3.0-Template/indexTemplate'),
	require('./0.3.0-0.5.0'),
	require('./0.5.0-0.6.0'),
	require('./0.6.0-0.7.0'),
	require('./0.7.0-0.8.0'),
	require('./0.8.0-1.0.0')
	/* eslint-enable global-require */
];

module.exports = migrations;
