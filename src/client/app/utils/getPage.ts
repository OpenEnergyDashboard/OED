/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Returns the current page route
 * @returns current page name as a string
 */
export default function getPage(): string {
	const urlArr = window.location.href.split('/');
	return urlArr[urlArr.length - 1];
}
