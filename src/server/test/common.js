/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file exports two useful items: testDB, which provides the method .getConnection,
 * returning a connection to the testing database, and recreateDB, which destroys the
 * database and creates a new schema there.
 */

const mocha = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiHttp = require('chai-http');
const bcrypt = require('bcryptjs');
const expect = chai.expect;

const { log, LogLevel } = require('../log');
// Disable logging during tests.
// TODO: Move logging disabling to a better place.
log.level = LogLevel.SILENT;
log.emailLevel = LogLevel.SILENT;

const User = require('../models/User');
const { getDB, currentDB, createSchema, stopDB } = require('../models/database');
const { swapConnection, dropConnection } = require('../db');
const app = require('../app');

// Configure Chai to use the required plugins
chai.use(chaiAsPromised);
chai.use(chaiHttp);

// Global database connection object, whose members are accessible to DB-touching tests.
// For instance, call:
// conn = testDB.getConnection();
// doSomething(conn)
let testDB = {
	_connection: null,
	config: null,
	getConnection: function() {
		return this._connection;
	}
};

function connectTestDB() {
	const testDBConfig = {
		user: process.env.OED_DB_TEST_USER || process.env.OED_DB_USER,
		database: process.env.OED_DB_TEST_DATABASE,
		password: process.env.OED_DB_TEST_PASSWORD || process.env.OED_DB_PASSWORD,
		host: process.env.OED_DB_TEST_HOST || process.env.OED_DB_HOST,
		port: process.env.OED_DB_TEST_PORT || process.env.OED_DB_PORT
	};

	stopDB();
	testDB._connection = getDB(testDBConfig);
	testDB.config = testDBConfig;
	swapConnection(testDB.config, testDB._connection);
}

// The user for use by tests.
const testUser = new User(undefined, 'test@example.invalid', bcrypt.hashSync('password', 10), User.role.ADMIN);
testUser.password = 'password';

async function recreateDB() {
	conn = testDB.getConnection();
	// This should drop all database objects, as long as they were all created by the current database user
	// They should be, since they were all created during a previous test.
	await conn.none('DROP OWNED BY current_user;');
	await createSchema(conn);
	await testUser.insert(conn);
}

mocha.before(() => {
	connectTestDB();
});

mocha.beforeEach(async () => {
	await recreateDB();
});

mocha.after(() => {
	dropConnection();
});

module.exports = {
	chai,
	mocha,
	expect,
	app,
	testUser,
	recreateDB,
	testDB
};
