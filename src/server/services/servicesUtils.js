/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { log } = require('../log');
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function terminateReadline(message) {
	if (message) log.info(message);
	rl.close();
	process.exit(0);
}

module.exports = {
	terminateReadline,
};
