/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UserRole } from '../types/items';

/**
 * Checks if the role A has the permission of the role B.
 *
 * @param {UserRole} userA variable for role A
 * @param {UserRole} userB variable for role B
 * @returns {boolean} Returns true if role A has permissions of role B
 */
export function hasPermissions(user: UserRole, compareTo: UserRole): boolean {
	// Admins always have any other role.
	return user === UserRole.ADMIN || user === compareTo;
}

/**
 * Checks if user is an Admin.
 *
 * @param {UserRole} user User role to evaluate
 * @returns {boolean} Whether or not user is an admin
 */
export function isRoleAdmin(user: UserRole): boolean {
	return user === UserRole.ADMIN;
}
