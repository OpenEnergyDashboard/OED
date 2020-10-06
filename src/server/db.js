/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Provides database access for the application. */

const config = require('./config');
const { getDB, stopDB } = require('./models/database');

// Global database connection manager.
let connmanager = {
	connection: null,
	config: null
};


/**
 * Connect to the database based on the configuration provided to the app.
 * Reuses an existing connection pool if one is available.
 */
function getConnection() {
	// console.log("at start of getConnection()");
	if (connmanager.config === null) {
		// console.log("DEBUG: getConnection has null config");
		connmanager.config = config.database;
	}

	if (connmanager.connection === null) {
		// console.log("DEBUG: getConnection has null connection");
		connmanager.connection = getDB(connmanager.config);
	}
	// console.log("DEBUG: getConnection has connmanager.config of:", connmanager.config);
	// console.log("DEBUG: getConnection has connmanager.connection of:", connmanager.connection);

	return connmanager.connection;
}

/**
 * Drop the connection to the database and ask PGPromise to disconnect.
 * New calls to getConnection() will use a new connection pool.
 */
function dropConnection() {
	// console.log("DEBUG: in dropConnection");
	connmanager.config = null;
	connmanager.connection = null;
	stopDB();
}

/**
 * Drop the current connmanager.connection. Unlike dropConnection() it
 * should not disconnect other connections.
 */
function dropCurrentConnection() {
	// console.log("DEBUG: in dropCurrentConnection");
	if (connmanager.connection !== null) {
		// Disconnect this specific connection.
		// console.log("DEBUG: before poll.end in dropCurrentConnection");
		connmanager.connection.$pool.end();
	}
	connmanager.config = null;
	connmanager.connection = null;
}

/**
 * Swaps the connection to the database with a new connection and config.
 */
function swapConnection(newConfig, newConnection) {
	// console.log("DEBUG: connmanager.connection", connmanager.connection);
	// This used to call dropConnection but that removes all connections to DB
	// including the one you are about to swap in so it failed.
	// When this is called by connectTestDB(), the connection is still null so
	// this really isn't needed but do to be extra safe and consistent with other code
	// and in case it is used somewhere else.
	dropCurrentConnection();
	connmanager.config = newConfig;
	if (newConnection !== null) {
		connmanager.connection = newConnection;
	} else {
		connmanager = getDB(connmanager.config);
	}
}

module.exports = { getConnection, dropConnection, swapConnection };

