/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { log } = require('../log');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Verifies that an email is valid
function checkEmail(email) {
	// See https://stackoverflow.com/a/46181/5116950
	// eslint-disable-next-line max-len, no-useless-escape
	const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regexEmail.test(email);
}

// Asks the user for an e-mail.
function askEmail() {
	return new Promise((resolve, reject) => {
		rl.question('Email: ', email => {
			if (checkEmail(email)) resolve(email);
			else reject(email);
		});
	});
}

function askPassword(email) {
	return new Promise(resolve => {
		rl.question('Password: ', password => { resolve([email, password]); });
	});
}

function terminateReadline(message) {
	if (message) log.info(message);
	rl.close();
	process.exit(0);
}

(async () => {
	let email;
	let password;

	// If there aren't enough args, go interactive.
	const cmdArgs = process.argv;
	if (cmdArgs.length !== 4) {
		let emailResult;
		try {
			emailResult = await askEmail();
		} catch (err) {
			terminateReadline('Invalid email, no user created');
		}
		const output = await askPassword(emailResult);
		email = output[0];
		password = output[1];
	} else {
		email = cmdArgs[2];
		password = cmdArgs[3];

		if (!checkEmail(email)) {
			terminateReadline('Invalid email, no user created');
		}
	}

	if (password.length < 8) {
		terminateReadline('Password must be at least eight characters, no user created');
	}

	const admin = new User(undefined, email, bcrypt.hashSync(password, 10));
	try {
		await admin.insert();
		terminateReadline('User created');
	} catch (err) {
		terminateReadline('User already exists, no additional user created');
	}
})();
