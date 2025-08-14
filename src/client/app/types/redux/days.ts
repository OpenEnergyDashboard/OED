/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface Day {
	id: number;
	name: string;
	note: string;
}

export interface DaySegment {
	id: number;
	dayId: number;
	startHour: number;
	endHour: number;
	slope: number;
	intercept: number;
	note?: string;
}

export interface CreateDayPayload {
	/**
	 * Day name
	 */
	name: string;
	/**
	 * Day note
	 */
	note?: string;
	/**
	 * Initial segment slope
	 */
	slope: number;
	/**
	 * Initial segment intercept
	 */
	intercept: number;
	/**
	 * Initial segment note
	 */
	segmentNote?: string;
}

export interface UpdateDaySegmentPayload extends DaySegment {
	originalStartHour: number;
	originalEndHour: number;
}

export interface SplitDaySegmentPayload {
	id: number;
	newSlope: number;
	newIntercept: number;
	newNote?: string;
	splitTime: number;
}
