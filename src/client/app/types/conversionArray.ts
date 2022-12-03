/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { conversionArrayApi } from '../utils/api';

export class ConversionArray {
	// Holds the pik array.
	static pik: boolean[][];
	// True if pik array has been filled in.
	static available = false;

	/**
	 * Gets pik from the server and stores in class variable pik for later use.
	 */
	static async fetchPik() {
		this.available = false;
		this.pik = await conversionArrayApi.getConversionArray();
		this.available = true;
	}

	/**
	 * @returns {boolean} returns true if pik has values and false if not yet filled in.
	 */
	static pikAvailable() {
		return this.available;
	}
}