/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface ConversionData {
	sourceId: number;
	destinationId: number;
	bidirectional: boolean;
	slope: number;
	intercept: number;
	note: string;
}

export interface ConversionsState {
	hasBeenFetchedOnce: boolean,
	isFetching: boolean;
	selectedConversions: number[];
	// Use an array of ConversionData because we need the combination of source/destination id to give us a unique conversion
	submitting: ConversionData[];
	conversions: ConversionData[];
}
