/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { ask, terminateReadline } = require('../utils');
const { getConnection } = require('../../db');
const moment = require('moment');

(async () => {
	let username;
	// Set password to unused value. Coverity Scan thinks it is not set but logic below seems to
	// always set of call terminateReadline that stops to process. This should fix this.
	let password = 'whatever';

	// If there aren't enough args, go interactive.
	const cmdArgs = process.argv;
	if (cmdArgs.length !== 4) {
		username = await ask('Username of user to create: ');
		if (username.length < 3) {
			terminateReadline('Username must be a minimum of 3 characters, no user created.');
		} else {
			password = await ask('Password: ');
		}
	} else {
		username = cmdArgs[2];
		password = cmdArgs[3];

		if (username.length < 3) {
			terminateReadline('Username must be a minimum of 3 characters, no user created.');
		}
	}

	if (password.length < 8) {
		terminateReadline('Password must be at least eight characters, no user created');
	}

	const passwordHash = bcrypt.hashSync(password, 10);
	const admin = new User(undefined, username, passwordHash, User.role.ADMIN,
		`User ${username} created via createUser on ${moment().toISOString()}`);
	const conn = getConnection();
	try {
		// Check if user already exists and only create if does not.
		if (await User.getByUsername(admin.username, conn) === null) {
			await admin.insert(conn);
			// Return ok error code and user created.
			terminateReadline(`User ${admin.username} created`, 0);
		} else {
			// Return ok error code and user existed.
			terminateReadline(`User ${admin.username} existed so not created`, 0);
		}
	} catch (err) {
		// Something went wrong with insertion so return error code.
		// This assumes the err has a message. This could be done better.
		terminateReadline('Creation of user failed with err: ' + err.message, 11);
	}
})();
