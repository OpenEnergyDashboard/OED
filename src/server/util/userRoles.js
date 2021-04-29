/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const promisify = require('es6-promisify');
const jwtVerify = promisify(jwt.verify);
const { getConnection } = require('../db');
const secretToken = require('../config').secretToken;

/**
 * Checks if a role has the authorization capabilities as the requested role. 
 * @param {User.role} role is a role listed in User.role
 * @param {User.role} requestedRole is a role listed in User.role
 * @returns {boolean} true if role has the permissions of the requestedRole. Returns false otherwise.
 */
function isRoleAuthorized(role, requestedRole) {
	if (role === User.role.ADMIN) {
		return true;
	} else {
		return role === requestedRole;
	}
}

/**
 * Checks if a token (assumed to be verified) has the authorization capabilities as the requested role. 
 * @param token is a jwt token
 * @param {User.role} requestedRole is a role listed in User.role
 * @returns {Promise<boolean>} true if the token has the permissions of the requestedRole. Returns false otherwise.
 */
async function isTokenAuthorized(token, requestedRole) {
	try {
		const payload = await jwtVerify(token, secretToken);
		const { data: id } = payload;
		const conn = getConnection();
		const { role } = await User.getByID(id, conn);
		return isRoleAuthorized(role, requestedRole);
	} catch (error) {
		return false;
	}
}

/**
 * Checks if a user is authorized by role.
 * @param {User} user 
 * @param {User.role} requestedRole is a role listed in User.role
 * @returns {boolean} true if the user object has permissions of the requestedRole. Returns false otherwise.
 */
function isUserAuthorized(user, requestedRole) {
	return isRoleAuthorized(user.role, requestedRole);
}

module.exports = {
	isUserAuthorized,
	isTokenAuthorized
}