/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./config');
const pgp = require('pg-promise')();

/**
 * Internal connection state
 */
let connection = null;
let connectionConfig = null;

/**
 * Get or create DB connection pool
 */
function getConnection() {
	if (!connection) {
		connectionConfig = config.database;
		connection = pgp(connectionConfig);
	}

	return connection;
}

/**
 * Fully close DB pool
 */
function dropConnection() {
	if (connection) {
		pgp.end();
	}

	connection = null;
	connectionConfig = null;
}

/**
 * Replace connection (used for testing)
 */
function swapConnection(newConfig, newConnection = null) {
	dropConnection();

	connectionConfig = newConfig;

	if (newConnection) {
		connection = newConnection;
	} else {
		connection = pgp(connectionConfig);
	}
}

module.exports = {
	getConnection,
	dropConnection,
	swapConnection
};