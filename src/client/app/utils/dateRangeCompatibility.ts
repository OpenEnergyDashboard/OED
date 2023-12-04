/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';
import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';

/**
 * Converts from OED's TimeInterval into a DateRange for compatibility with @wojtekmaj's DateRangePicker
 * Refer to https://github.com/wojtekmaj/react-calendar/issues/511#issuecomment-835333976 for an explanation behind the logic.
 * @param timeInterval - current redux state
 * @returns the converted DateRange [start, end] as Date() Objects.
 */
export function timeIntervalToDateRange(timeInterval: TimeInterval): Value {
	if (timeInterval.getIsBounded()) {
		const startTimeStamp = timeInterval.getStartTimestamp().toISOString().slice(0, -1);
		const endTimeStamp = timeInterval.getEndTimestamp().toISOString().slice(0, -1);
		const startDate = new Date(startTimeStamp);
		const endDate = new Date(endTimeStamp);
		return [startDate, endDate];
	}
	return null;
}

/**
 * Handles Date Object locale stripping. Removes the timeZoneOffset from Date Object's UTC String.
 * Refer to https://github.com/wojtekmaj/react-calendar/issues/511#issuecomment-835333976 for an explanation behind the logic.
 * @param date - Date Object to be converted.
 * @returns modified date to remove locale quirks with Moment.UTC
 */
export function toUTC(date: Date) {
	return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}

/**
 * Converts from DateRange to OED's TimeInterval for compatibility with @wojtekmaj's DateRangePicker
 * @param dateRange - DateRange to be converted
 * @returns the translated TimeInterval
 */
export function dateRangeToTimeInterval(dateRange: Value): TimeInterval {
	let start = null;
	let end = null;
	if (Array.isArray(dateRange)) {
		[start, end] = dateRange;
	}
	if (start && end) {
		start = moment(toUTC(start));
		end = moment(toUTC(end));
		return new TimeInterval(start, end);
	}
	// If start or end ts is missing, treat as unbounded interval
	return TimeInterval.unbounded();
}

/**
 * Rounds Time interval for a full day's worth of readings for use with 3d Graphics
 * @param timeInterval TimeInterval to be rounded to the full day(s)
 * @returns the a time interval into a dateRange compatible for 3d graphics
 */
export function roundTimeIntervalForFetch(timeInterval: TimeInterval): TimeInterval {
	if (timeInterval.getIsBounded()) {
		// clone() prevents startOf/endOf from mutating the original timeInterval which will cause issues down the nested dispatch chain
		const startTS = timeInterval.getStartTimestamp().clone();
		const endTS = timeInterval.getEndTimestamp().clone();
		startTS.startOf('day');
		//subtract a millisecond in the case that the time is on an hour boundary
		endTS.add(-1, 'millisecond');
		endTS.endOf('day');
		endTS.add(1, 'millisecond');
		return new TimeInterval(startTS, endTS);
	}
	return TimeInterval.unbounded();
}

/**
 * Determines if Time Interval is valid for 3d graphic. Is bounded, and a year or less.
 * @param timeInterval - current redux state
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
export function isValidThreeDInterval(timeInterval: TimeInterval): boolean {
	return timeInterval.getIsBounded() && timeInterval.duration('days') <= 367;
}
