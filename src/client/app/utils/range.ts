/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Get array of numbers from a low and a high number
 * @param lower is low number
 * @param higher is high number
 * @returns array of numbers
 */
export function range(lower: number, higher: number): number[] {
	const arr = [];
	for (let i = lower; i < higher; i++) {
		arr.push(i);
	}
	return arr;
}