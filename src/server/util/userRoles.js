/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const promisify = require('es6-promisify');
const jwtVerify = promisify(jwt.verify);
const { getConnection } = require('../db');
const secretToken = require('../config').secretToken;

/** Checks if a role has the authorization capabilities as the requested role. */
function isRoleAuthorized(role, requestedRole) {
	if (role === User.role.ADMIN) {
		return true;
	} else {
		return role === requestedRole;
	}
}

/** Checks if a token (assumed to be verified) has the authorization capabilities as the requested role. */
async function isTokenAuthorized(token, requestedRole) {
	const payload = await jwtVerify(token, secretToken);
	const { data: id } = payload;
	const conn = getConnection();
	const { role } = await User.getByID(id, conn);
	return isRoleAuthorized(role, requestedRole);
}

/** Checks if a user is authorized. */
/**
 * 
 * @param {User} user 
 * @param requestedRole 
 */
function isUserAuthorized(user, requestedRole) {
	return isRoleAuthorized(user.role, requestedRole);
}

module.exports = {
	isUserAuthorized,
	isTokenAuthorized
}