/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface Baseline {
	meterId: number;
	// Whether there's a baseline applied or not
    isActive: boolean;
	note?: string;
}

export interface BaselineSegment {
	id: number;
	meterId: number;
	startTime: number;
	endTime: number;
	baselineValue: number;
	note?: string;
}

export interface UpdateBaselineSegmentPayload extends BaselineSegment {
	originalStartHour: number;
	originalEndHour: number;
}

export interface CreateBaselinePayload {
	meterId: number;
	isActive: boolean;
	// Baseline note
	note?: string;
	baselineValue: number;
	// First segment note
	segmentNote?: string;
}

export interface SplitBaselineSegmentPayload {
	id: number;
	meterId: number;
	newBaselineValue: number;
	newNote?: string;
	splitTime: number;
}
