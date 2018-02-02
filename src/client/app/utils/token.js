/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Returns the tokens from local storage, throws an error if the token does not exist
 * @returns {string}
 */
export function getToken() {
	const token = localStorage.getItem('token');
	if (token === null) {
		throw Error('No token found');
	}
	return token;
}

/**
 * Check if there is a token in local storage
 * @returns {boolean}
 */
export function hasToken() {
	try {
		getToken();
	} catch (e) {
		return false;
	}
	return true;
}
