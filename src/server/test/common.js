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
const expect = chai.expect;

// Configure Chai to use the required plugins
chai.use(chaiAsPromised);
chai.use(chaiHttp);

module.exports = {
	chai,
	mocha,
	expect,
};
