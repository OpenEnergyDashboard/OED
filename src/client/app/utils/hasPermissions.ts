/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import { UserRole } from '../types/items';
import { hasToken } from './token';

/**
 * Checks if the role A has the permission of the role B.
 */
export function hasPermissions(userA: UserRole, userB: UserRole): boolean {
	// Admins always have any other role.
	return userA === UserRole.ADMIN || userA === userB;
}

/**
 * Checks if the role A is an Admin.
 */
export function isRoleAdmin(A: UserRole): boolean {
	return A === UserRole.ADMIN && hasToken();
}

/*
export function isRoleAdmin(A: UserRole): boolean {
	if(A !== UserRole.ADMIN) {
		return false;
	} else if (hasToken()) {
		return true;
	} else {
		// TODO delete the user profile from state
		return false
	}
}
*/
