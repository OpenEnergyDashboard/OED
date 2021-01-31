/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { validateEmail } = require('./utils');
const { ask, terminateReadline } = require('../utils');
const { getConnection, dropConnection } = require('../../db');

(async () => {
	let email;
	// Set password to unused value. Coverity Scan thinks it is not set but logic below seems to
	// always set of call terminateReadline that stops to process. This should fix this.
	let password = 'whatever';
	let csvEmail;
	let obviusEmail;
	let csvPassword = password;
	let obviusPassword = password;

	// If there aren't enough args, go interactive.
	const cmdArgs = process.argv;
	if (cmdArgs.length !== 8) {
		email = await ask('Email of user to create: ');
		if (!validateEmail(email)) {
			terminateReadline('Invalid email, no user created');
		} else {
			password = await ask('Password: ');
		}
		csvEmail = await ask('Email of CSV user to create: ');
		if(!validateEmail(csvEmail)){
			csvPassword = await ask('Password for CSV user: ');
		} else {
			terminateReadline('Invalid email, no user created');
		}
		obviusPassword = await ask('Email of Obvius user to create: ');
		if(!validateEmail(obviusEmail)){
			obviusPassword = await ask('Password for CSV user: ');
		} else {
			terminateReadline('Invalid email, no user created');
		}
	} else {
		email = cmdArgs[2];
		password = cmdArgs[3];
		csvEmail = cmdArgs[4];
		csvPassword = cmdArgs[5];
		obviusEmail = cmdArgs[6];
		obviusPassword = cmdArgs[7];

		if (!validateEmail(email)) {
			terminateReadline('Invalid email, no user created');
		}
	}

	if (password.length < 8) {
		terminateReadline('Password must be at least eight characters, no user created');
	}
	if (csvPassword.length < 8) {
		terminateReadline('CSV user\'s password must be at least eight characters, no user created');
	}
	if (obviusPassword.length < 8) {
		terminateReadline('Obvius user\'s password must be at least eight characters, no user created');
	}

	const passwordHash = bcrypt.hashSync(password, 10);
	const csvPasswordHash = await bcrypt.hash(csvPassword, 10);
	const obviusPasswordHash = await bcrypt.hash(obviusPassword, 10);
	const admin = new User(undefined, email, passwordHash, User.role.ADMIN);
	const csvUser = new User(undefined, csvEmail, csvPasswordHash, User.role.CSV);
	const obviusUser = new User(undefined, obviusEmail, obviusPasswordHash, User.role.OBVIUS);
	const conn = getConnection();
	try {
		await admin.insert(conn);
		await csvUser.insert(conn);
		await obviusUser.insert(conn);
		// We could select to check if user already there to report separately but not
		// doing since we don't do for createDB. This might be useful if we have issues
		// around this insert.

		// Insert did not report an error so user should be there. Return ok error code.
		terminateReadline('User created or already exists', 0);
	} catch (err) {
		// Something went wrong with insertion so return error code.
		// This assumes the err has a message. This could be done better.
		terminateReadline('Creation of user failed with err: ' + err.message, 11);
	} finally {
		dropConnection();
	}
})();
