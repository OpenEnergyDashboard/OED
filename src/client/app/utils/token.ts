/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export function getToken(): string {
	const token = localStorage.getItem('token');
	if (token === null) {
		throw Error('No token found');
	}
	return token;
}

export function hasToken(): boolean {
	try {
		getToken();
	} catch (e) {
		return false;
	}
	return true;
}

export function deleteToken(): void {
	localStorage.removeItem('token');
}
