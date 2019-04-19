/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface CompressedLineReading {
	reading: number;
	startTimestamp: number;
	endTimestamp: number;
}

export interface CompressedLineReadings {
	[id: number]: CompressedLineReading[];
}

export interface CompressedBarReading {
	reading: number;
	startTimestamp: number;
	endTimestamp: number;
}

export interface CompressedBarReadings {
	[id: number]: CompressedBarReading[];
}
