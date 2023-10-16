/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Get Token from local storage
 * @returns if found token, return it, otherwise, throw error
 */
export function getToken(): string {
	const token = localStorage.getItem('token');
	if (token === null) {
		throw Error('No token found');
	}
	return token;
}

/**
 * Check if there is a Token in local storage
 * @returns If there is a Token, return True; otherwise return false
 */
export function hasToken(): boolean {
	try {
		getToken();
	} catch (e) {
		return false;
	}
	return true;
}

/**
 * Remove 'token' from local storage
 */
export function deleteToken(): void {
	localStorage.removeItem('token');
}
