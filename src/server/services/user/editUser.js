/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/ */

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { askEmail, askPassword, terminateReadline } = require('./utils');

(async () => {
	let emailResult;
	try {
		emailResult = await askEmail('Email of user to modify');
	} catch (err) {
		terminateReadline('Invalid email, no user modified');
	}
	const output = await askPassword(emailResult);
	const email = output[0];
	const password = output[1];

	if (password.length < 8) {
		terminateReadline('Password must be at least eight characters, user\'s password not modified');
	}

	try {
		const passwordHash = bcrypt.hashSync(password, 10);
		await User.updateUserPassword(email, passwordHash);
		terminateReadline('User\'s password updated');
	} catch (err) {
		terminateReadline('Failed to update user\'s password');
	}
})();
