/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UserRole } from '../types/items';

/**
 * Checks if the role A has the permission of the role B.
 */
export function hasPermissions(A: UserRole, B: UserRole): boolean {
	return A === UserRole.ADMIN || A === B;
}

/**
 * Checks if the role A is an Admin.
 */
export function isRoleAdmin(A: UserRole): boolean {
	return A === UserRole.ADMIN;
}