/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LineGraphRates } from '../types/redux/graph';

// Checks if custom rate is valid by verifying that it is a positive integer.
export const customRateValid = (customRate: number) => {
	return Number.isInteger(customRate) && customRate >= 1;
};

/**
 * Determines if the rate is custom.
 * @param rate The rate to check
 * @returns true if the rate is custom and false if it is a standard value.
 */
export const isCustomRate = (rate: number) => {
	// Check if the rate is a custom rate.
	return !Object.entries(LineGraphRates).some(
		([, rateValue]) => {
			// Multiply each rate value by 3600, round it to the nearest integer,
			// and compare it to the given rate
			return Math.round(rateValue * 3600) === rate;
		});
};
