/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface CompareReading {
	curr_use: number;
	prev_use: number;
}

export interface CompareReadings {
	[id: number]: CompareReading;
}

export interface RawReadings {
	// Note that the identifiers are not the usual ones so the route
	// sends less data since they are one letter long. Testing indicated
	// up to a 25% reduction in the network traffic. It is done for raw
	// since the export can send lots of data (unlike graphing).
	r: number,
	s: string,
	e: string
}

export interface LineReading {
	reading: number;
	startTimestamp: number;
	endTimestamp: number;
}

export interface LineReadings {
	[id: number]: LineReading[];
}

export interface BarReading {
	reading: number;
	startTimestamp: number;
	endTimestamp: number;
}

export interface BarReadings {
	[id: number]: BarReading[];
}
