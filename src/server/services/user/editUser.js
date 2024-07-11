/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const bcrypt = require('bcryptjs');
 const User = require('../../models/User');
 const { ask, terminateReadline } = require('../utils');
 const { getConnection } = require('../../db');
 
 (async () => {
	 let email;
	 let newEmail;
	 let password;
	 let role;
 
	 try {
		 email = await ask('Email of user to modify: ');
	 } catch (err) {
		 terminateReadline('Invalid email, no user modified');
	 }
 
	 try {
		 newEmail = await ask('New email (leave blank to keep current): ');
	 } catch (err) {
		 terminateReadline('Invalid email');
	 }
 
	 password = await ask('Password: ');
 
	 if (password.length < 8) {
		 terminateReadline('Password must be at least eight characters, user\'s password not modified');
	 }
 
	 role = await ask('Role: '); // untested
	 role = role.toUpperCase();
	 if (User.role[role] === undefined) {
		 terminateReadline('Role must be one of Admin, CSV, Obvius, Export. user\'s role not modified');
	 }
 
	 const conn = getConnection();
	 try {
		 const user = await User.getByEmail(email, conn);
		 if (user === null) {
			 terminateReadline('No user with that email exists');
		 }
 
		 // Check if new email is provided and is different from current email
		 if (newEmail && newEmail !== email) {
			 const emailExists = await User.getByEmail(newEmail, conn);
			 if (emailExists) {
				 terminateReadline('A user with the new email already exists');
			 } else {
				 await User.updateUserEmail(user.id, newEmail, conn);
				 console.log('User\'s email updated');
			 }
		 }
	 } catch (err) {
		 terminateReadline('User email lookup failed with err: ', err);
	 }
 
	 try {
		 const passwordHash = bcrypt.hashSync(password, 10);
		 await User.updateUserPassword(email, passwordHash, conn);
		 await User.updateUserRole(email, role, conn);
		 terminateReadline('User\'s password and role updated');
	 } catch (err) {
		 terminateReadline('Failed to update user\'s password and role with error: ', err);
	 }
 })();
 