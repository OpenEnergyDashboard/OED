/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const readline = require('readline');
const { log } = require('../../log');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Verifies that an email is valid
function validateEmail(email) {
	// See https://stackoverflow.com/a/46181/5116950
	// tslint:disable-next-line max-line-length
	const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regexEmail.test(email);
}

// Asks the user for an email
function askEmail(text) {
	return new Promise((resolve, reject) => {
		rl.question(`${text}: `, email => {
			if (validateEmail(email)) {
				resolve(email);
			} else {
				reject(email);
			}
		});
	});
}

// Asks the user for a password
function askPassword(email) {
	return new Promise(resolve => {
		rl.question('Password: ', password => { resolve([email, password]); });
	});
}

function ask(question) {
	return new Promise(resolve => {
		rl.question(question, response => resolve(response));
	});
}

function terminateReadline(message) {
	if (message) { log.info(message); }
	rl.close();
	process.exit(0);
}

module.exports = {
	askEmail,
	askPassword,
	validateEmail,
	terminateReadline
};
