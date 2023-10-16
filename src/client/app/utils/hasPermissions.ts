/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UserRole } from '../types/items';

/**
 * Checks if the user has the permissions of a given role.
 * @param user User role to evaluate
 * @param compareTo User role to compare to
 * @returns Whether or not the user has the compareTo role
 */
export function hasPermissions(user: UserRole, compareTo: UserRole): boolean {
	// Admins always have any other role.
	return user === UserRole.ADMIN || user === compareTo;
}

/**
 * Checks if user is an Admin.
 * @param user User role to evaluate
 * @returns Whether or not user is an admin
 */
export function isRoleAdmin(user: UserRole): boolean {
	return user === UserRole.ADMIN;
}
