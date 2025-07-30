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
	segments?: ConversionSegment[]; // Optional since new conversions (e.g., in Create Conversion) won’t have segments initially
}

export interface ConversionsState {
	hasBeenFetchedOnce: boolean,
	isFetching: boolean;
	selectedConversions: number[];
	// Use an array of ConversionData because we need the combination of source/destination id to give us a unique conversion
	submitting: ConversionData[];
	conversions: ConversionData[];
}

export interface ConversionSegment {
	start_time: string;
	end_time: string;
	slope: number;
	intercept: number;
	week_patterns_id: number | null;
	note: string;
}
