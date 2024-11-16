/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Checks if custom rate is valid by verifying that it is a positive integer.
export const customRateValid = (customRate: number) => {
	return Number.isInteger(customRate) && customRate >= 1;
};
