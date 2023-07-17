/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';
import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';


/**
 * Converts from OED's TimeInterval into a DateRange for compatibility with @wojtekmaj's DateRangePicker
 * @param dateRange - DateRange to be converted
 * @returns the a time interval into a dateRange compatible for a date-picker using Date().
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
	return TimeInterval.unbounded();
}

/**
 * Converts from OED's TimeInterval into a DateRange for compatibility with DateRangePicker
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
 * Converts from OED's TimeInterval into a DateRange for compatibility with @wojtekmaj's DateRangePicker
 * @param dateRange - DateRange to be converted
 * @returns the a time interval into a dateRange compatible for a date-picker using Date().
 */
export function dateRangeToTimeIntervalFetch(dateRange: Value): TimeInterval {
	let start: Date | null = null;
	let end: Date | null = null;
	if (Array.isArray(dateRange)) {
		[start, end] = dateRange;
	}
	if (start && end) {
		const startRound = new Date(start);
		const endRound = new Date(end);
		startRound.setHours(0,0,0,0);
		endRound.setHours(0,0,0,0);
		endRound.setDate(endRound.getDate() + 1);
		const startInterval = moment(toUTC(startRound));
		const endInterval = moment(toUTC(endRound));
		return new TimeInterval(startInterval, endInterval);
	}
	return TimeInterval.unbounded();
}
/**
 * Handles Date Object locale conversion to utc for compatibility with Moment.UTC
 * @param date - Date Object to be converted.
 * @returns modified date to remove locale quirks with Moment.UTC
 */
export function toUTC(date: Date) {
	return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}