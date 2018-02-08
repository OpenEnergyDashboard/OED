/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { askEmail, askPassword, terminateReadline, validateEmail } = require('./utils');

(async () => {
	let email;
	let password;

	// If there aren't enough args, go interactive.
	const cmdArgs = process.argv;
	if (cmdArgs.length !== 4) {
		let emailResult;
		try {
			emailResult = await askEmail('Email of user to create');
		} catch (err) {
			terminateReadline('Invalid email, no user created');
		}
		const output = await askPassword(emailResult);
		email = output[0];
		password = output[1];
	} else {
		email = cmdArgs[2];
		password = cmdArgs[3];

		if (!validateEmail(email)) {
			terminateReadline('Invalid email, no user created');
		}
	}

	if (password.length < 8) {
		terminateReadline('Password must be at least eight characters, no user created');
	}

	const passwordHash = bcrypt.hashSync(password, 10);
	const admin = new User(undefined, email, passwordHash);
	try {
		await admin.insert();
		terminateReadline('User created');
	} catch (err) {
		terminateReadline('User already exists, no additional user created');
	}
})();
