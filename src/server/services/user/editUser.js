/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { ask, terminateReadline } = require('../utils');
const { getConnection } = require('../../db');

(async () => {
	let user = new User;
	let username;
	let password;
	let role;
	let note;
	const conn = getConnection();

	try {
		username = await ask('Username of user to modify: ');
	} catch (err) {
		terminateReadline('Invalid username, no user modified');
	}

	try {
		user = await User.getByUsername(username, conn);

		if (user === null) {
			terminateReadline('No user with that username exists');
		}
	} catch (err) {
		terminateReadline('User username lookup failed with err: ', 1, err);
	}

	password = await ask('Password: ');
	if (password.length < 8) {
		terminateReadline('Password must be at least eight characters, user\'s password not modified');
	}
	try {
		const passwordHash = bcrypt.hashSync(password, 10);
		await User.updateUserPassword(user.id, passwordHash, conn);
		console.log('User\'s password updated');
	} catch (err) {
		terminateReadline('Failed to update user\'s password with error: ', 1, err);
	}

	console.log('User\'s current role is: ' + user.role);
	role = await ask('Role: ');
	role = role.toUpperCase();
	if (User.role[role] === undefined) {
		terminateReadline('Role must be one of Admin, CSV, Obvius, Export. user\'s role not modified');
	}
	try {
		await User.updateUserRole(user.id, User.role[role], conn);
		console.log('User\'s role updated');
	} catch (err) {
		terminateReadline('Failed to update user\'s role with error: ', 1, err);
	}

	note = user.note;
	try {
		let newNote = '';
		if (note === undefined) {
			note = '';
		}
		console.log('Current User Stored note: ', user.note);
		updateOrAdd = await ask('Would you like to update user note or add to current user note or leave as is? (\'update\' or \'add\' or \'leave\')');
		if (updateOrAdd !== 'update' && updateOrAdd !== 'add' && updateOrAdd !== 'leave') {
			terminateReadline('Failed to update user\'s note. Choice must be update, add, or leave.');
		}
		if (updateOrAdd === 'update') {
			note = await ask('New Note: ');
			await User.updateUserNote(user.id, note, conn);
			console.log('User\'s note updated');
		} else if (updateOrAdd === 'add') {
			newNote = await ask('Additional Note: ');
			note = user.note + newNote;
			await User.updateUserNote(user.id, note, conn);
			console.log('User\'s note updated');
		} else {
			console.log('User\'s note left as is.');
		}
	} catch (err) {
		console.log('Error caught', err);
		terminateReadline('Failed to update user\'s note with error: ', 1, err);
	}
terminateReadline('\nFinished updating user. \nUsername: ' + username + '\nRole: ' + role + '\nNote: ' + note);
})();