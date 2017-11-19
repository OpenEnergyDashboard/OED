/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const log = require('../log');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function askEmail() {
	return new Promise((resolve, reject) => {
		rl.question('Email: ', email => {
			// See https://stackoverflow.com/a/46181/5116950
			// eslint-disable-next-line
			const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if (regexEmail.test(email))	resolve(email);
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
	if (message) log(message);
	rl.close();
	process.exit(0);
}

(async () => {
	let emailResult;
	try {
		emailResult = await askEmail();
	} catch (err) {
		terminateReadline('Invalid email, no user created');
	}
	const output = await askPassword(emailResult);
	const email = output[0];
	const password = output[1];

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
