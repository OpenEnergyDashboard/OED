/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Checks if a role has the authorization capabilities as the requested role. */
function isRoleAuthorized(role, requestedRole){
	if (role === User.role.ADMIN) {
		return true;
	} else {
		return role === requestedRole;
	}
}

/** Checks if a token has the authorization capabilities as the requested role. */
function isTokenAuthorized(token, requestedRole) {
	const payload = jwt.decode(token);
	const { role } = payload;
	return isRoleAuthorized(role, requestedRole);
}

/** Checks if credentials has the authorization capabilities as the requested role. */
async function areCredentialsAuthorized(email, password, requestedRole) {
	const conn = getConnection();
	const user = await User.getByEmail(email, conn);
	const isValid = await bcrypt.compare(password, user.passwordHash);
	if (isValid) {
		return isRoleAuthorized(user.role, requestedRole);
	} else {
		throw new Error('Invalid Password');
	}
}

module.exports = {
	areCredentialsAuthorized,
	isTokenAuthorized
}