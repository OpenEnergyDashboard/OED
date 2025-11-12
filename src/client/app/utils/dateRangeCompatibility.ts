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
	const startTS = timeInterval.getStartTimestamp();
	const endTS = timeInterval.getEndTimestamp();
	/* Clones and rewinds the end time by one millisecond.
	 * In the case where the end date has been pushed forward by a millisecond for data fetching purpose in
	 * the method dateRangeToTimeInterval (method below) a millisecond is subtracted in order to reverse the
	 * operation and to display the correct dates in the Date Range Picker.
	 * In the case where the correction is not needed incrementing by a millisecond won't change what users
	 * see.
	*/
	let startDate: Date | null = null;
	let endDate: Date | null = null;

	// If the start or end time is defined, convert it to a Date object.
	if (startTS) {
		const startTimeStamp = startTS.toISOString().slice(0, -1);
		startDate = new Date(startTimeStamp);
	}
	if (endTS) {
		const endTimeStamp = endTS.clone().subtract(1, 'millisecond').toISOString().slice(0, -1);
		endDate = new Date(endTimeStamp);
	}
	// If both start and end dates are undefined, return a null pair.
	return [startDate, endDate];
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
	let start: moment.Moment | undefined;
	let end: moment.Moment | undefined;

	if (Array.isArray(dateRange)) {
		const [startDate, endDate] = dateRange as [Date | null, Date | null];
		if (startDate) {
			start = moment(toUTC(startDate));
		}
		if (endDate) {
			end = moment(toUTC(endDate)).add(1, 'millisecond');
		}
	}
	/*	Adds a millisecond to the end time.
		For the case in which the end time is the last moment of the day (date = date.endOf('day)),
		adding a millisecond pushes the end time to the very beginning of the next day.
		For example the end date at 2020-07-20 at 23:59:59 will be truncated to
		2020-07-20 at 00:00:00. This is due to OED decision to graph only entire days causing the lost of the last date.
		In the case where the end date is not the last time in the day, this should not effect what users
		should see.
	*/

	const toReturn = new TimeInterval(start, end);
	return toReturn;
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
 * Maximum number of days allowed for 3D graphics.
 * Based on data size calculations: 3 years ≈ 823 KB of data.
 * This should be tested for performance and adjusted as needed.
 */
export const MAX_3D_DAYS = 1095; // 3 years

/**
 * Default number of days for 3D graphics if not specified by user.
 */
export const DEFAULT_3D_DAYS = 365; // 1 year

/**
 * Determines if Time Interval is valid for 3d graphic. Is bounded, and within maxDays limit.
 * @param timeInterval - current redux state
 * @param maxDays - maximum allowed days (defaults to MAX_3D_DAYS)
 * @returns true if the interval is bounded and within the maxDays limit
 */
export function isValidThreeDInterval(timeInterval: TimeInterval, maxDays: number = MAX_3D_DAYS): boolean {
	if (!timeInterval.getIsBounded()) {
		return false;
	}
	const days = timeInterval.duration('days');
	return days > 0 && days <= maxDays;
}

/**
 * Calculates the 3D date range based on the date range picker values and numDays setting.
 * This implements the 4-case logic for handling bounded/unbounded date ranges.
 * @param queryTimeInterval - The date range from the date range picker (DRS, DRE)
 * @param numDays - Number of days the 3D graphic should span
 * @param maxDays - Maximum allowed days (for validation)
 * @param maxDataDate - The latest full day with actual data (from dataRange API)
 * @param minDataDate - The earliest date with actual data (optional, for validation)
 * @returns Object with:
 *   - threeDInterval: The calculated 3D date range (TimeInterval)
 *   - shouldWarn: true if user should be warned (exceeds maxDays)
 *   - shouldShowGraph: false if graph should not be shown
 */
export function calculateThreeDDateRange(
	queryTimeInterval: TimeInterval,
	numDays: number,
	maxDays: number = MAX_3D_DAYS,
	maxDataDate?: moment.Moment,
	minDataDate?: moment.Moment
): { threeDInterval: TimeInterval; shouldWarn: boolean; shouldShowGraph: boolean } {
	const drs = queryTimeInterval.getStartTimestamp(); // Date Range Start
	const dre = queryTimeInterval.getEndTimestamp(); // Date Range End
	const drsBounded = drs !== undefined;
	const dreBounded = dre !== undefined;

	// Ensure maxDataDate is valid, default to now if not provided
	const validMaxDataDate = maxDataDate && maxDataDate.isValid()
		? maxDataDate.clone().endOf('day')
		: moment().endOf('day');

	// Get the latest full day for this data source (end of day)
	const threeDEndDate = validMaxDataDate.clone();

	let threeDStartDate: moment.Moment;
	let shouldWarn = false;
	let shouldShowGraph = true;

	if (drsBounded && dreBounded) {
		// Case 1: bounded, bounded
		// If DRE - DRS > maxDays then warn user and no graphic. Otherwise, use 3D DRS, DRE.
		const daysDiff = dre.diff(drs, 'days');
		if (daysDiff > maxDays) {
			shouldWarn = true;
			shouldShowGraph = false;
			// Return a dummy interval (won't be used since shouldShowGraph is false)
			return {
				threeDInterval: new TimeInterval(drs, dre),
				shouldWarn: true,
				shouldShowGraph: false
			};
		}
		// Use the date range picker values directly
		threeDStartDate = drs.clone();
	} else if (!drsBounded && dreBounded) {
		// Case 2: unbounded, bounded
		// Use DRE - numDays, DRE
		threeDStartDate = dre.clone().subtract(numDays, 'days');
	} else if (drsBounded && !dreBounded) {
		// Case 3: bounded, unbounded
		// Use max(DRS, 3D end date - numDays), latest full day for this data source
		const calculatedStart = threeDEndDate.clone().subtract(numDays, 'days');
		threeDStartDate = moment.max(drs, calculatedStart);
	} else {
		// Case 4: unbounded, unbounded
		// Use 3D end date - numDays, latest full day for this data source
		threeDStartDate = threeDEndDate.clone().subtract(numDays, 'days');
	}

	// Ensure start date is at beginning of day and end date is at end of day
	threeDStartDate.startOf('day');
	// threeDEndDate is already endOf('day')

	// Ensure the calculated range doesn't exceed maxDays
	const calculatedDays = threeDEndDate.diff(threeDStartDate, 'days');
	if (calculatedDays > maxDays) {
		shouldWarn = true;
		shouldShowGraph = false;
	}

	// Ensure start date is not before minDataDate if provided
	if (minDataDate && minDataDate.isValid()) {
		const minDateStart = minDataDate.clone().startOf('day');
		if (threeDStartDate.isBefore(minDateStart)) {
			threeDStartDate = minDateStart;
		}
	}

	// Ensure end date doesn't exceed maxDataDate
	if (threeDEndDate.isAfter(validMaxDataDate)) {
		threeDEndDate.set(validMaxDataDate.toObject());
	}

	const threeDInterval = new TimeInterval(threeDStartDate, threeDEndDate);
	return { threeDInterval, shouldWarn, shouldShowGraph };
}

/**
 * Gets the effective number of days to use for 3D graphics.
 * Returns numDays if provided, otherwise defaults to DEFAULT_3D_DAYS.
 * @param numDays - Number of days from Redux state (may be undefined)
 * @returns The number of days to use
 */
export function getEffectiveNumDays(numDays: number | undefined): number {
	return numDays !== undefined ? numDays : DEFAULT_3D_DAYS;
}
