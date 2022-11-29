/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UserRole } from '../types/items';

/**
 * Checks if the user has the permissions of a given role.
 * @param {UserRole} user User role to evaluate
 * @param {UserRole} compareTo User role to compare to
 * @returns {boolean} Whether or not the user has the permissions
 */
export function hasPermissions(user: UserRole, compareTo: UserRole): boolean {
	// Admins always have any other role.
	return user === UserRole.ADMIN || user === compareTo;
}

/**
 * Checks if the role A is an Admin.
 *
 * @param {UserRole} user User role to evaluate
 * @returns {boolean} Whether or not role A is an admin
 */
export function isRoleAdmin(user: UserRole): boolean {
	return user === UserRole.ADMIN;
}
