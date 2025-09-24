/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';
import translate from './translate';

/**
 * 'Day', 'Week' or 'FourWeeks'
 */
export enum ComparePeriod {
	Day = '1',
	Week = '7',
	FourWeeks = '28'
}

/**
 * 'Alphabetical', 'Ascending' or 'Descending'
 */
export enum SortingOrder {
	Alphabetical = 'Alphabetical',
	Ascending = 'Ascending',
	Descending = 'Descending'
}

/**
 * @param comparePeriod A string to validate as a comparePeriod
 * @returns Validated enum
 */
export function validateComparePeriod(comparePeriod: string): ComparePeriod {
	switch (comparePeriod) {
		case '1':
			return ComparePeriod.Day;
		case '7':
			return ComparePeriod.Week;
		case '28':
			return ComparePeriod.FourWeeks;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
}

/**
 * @param sortingOrder A string to validate as a SortingOrder
 * @returns Validated enum
 */
export function validateSortingOrder(sortingOrder: string): SortingOrder {
	switch (sortingOrder) {
		case 'Alphabetical':
			return SortingOrder.Alphabetical;
		case 'Ascending':
			return SortingOrder.Ascending;
		case 'Descending':
			return SortingOrder.Descending;
		default:
			throw new Error(`Unknown sorting order: ${sortingOrder}`);
	}
}

/**
 * Calculates a time interval for compare based on a period and moment
 * @param comparePeriod The compare length
 * @param currentTime The current time as a moment
 * @returns The time interval for compare
 */
export function calculateCompareTimeInterval(comparePeriod: ComparePeriod, currentTime: moment.Moment): TimeInterval {
	// begin will be the start of the compare time and end will be the end of the compare time.
	let begin;
	// OED uses raw/meter readings to get compare data so it is only accurate to the last reading.
	// We also limit the comparison to the last hour.
	// By setting the end time to the hour it works properly and avoids changing with each request
	// within the same hour. This avoids updating the Redux state so it is faster.
	// You also get an error with groups at times because the state was not to the hour but the final
	// time used to get the state was the start of the hour. This fixes that.
	// As elsewhere in OED, we take the moment that is the start of the hour, format it so it has that
	// date/time set to UTC (+00:00) and then create a moment that honors the UTC timezone.
	const end = moment.parseZone(currentTime.startOf('hour').format('YYYY-MM-DD HH:mm:ss') + '+00:00');
	switch (comparePeriod) {
		case ComparePeriod.Day:
			// begin is the start of the day.
			// The range is one day without any time remaining in this day to the previous hour.
			begin = moment.parseZone(currentTime.startOf('day').format('YYYY-MM-DD HH:mm:ss') + '+00:00');
			break;
		case ComparePeriod.Week:
			// begin is the start of the day on last Sunday.
			// The range is one week without any time remaining in this week to the previous hour.
			begin = moment.parseZone(currentTime.startOf('week').format('YYYY-MM-DD HH:mm:ss') + '+00:00');
			break;
		case ComparePeriod.FourWeeks:
			// begin is the start of the day on Sunday three weeks earlier than the Sunday of this week.
			// The range of time used is or four weeks without any time remaining in this week  to the previous hour.
			begin = moment.parseZone(currentTime.startOf('week').subtract(3, 'weeks').format('YYYY-MM-DD HH:mm:ss') + '+00:00');
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
	const compareTimeInterval = new TimeInterval(begin, end);
	return compareTimeInterval;
}

// TODO This function does not appear to be used - should it be removed?
/**
 * Converts a comparePeriod into a moment duration for the quality of the readings to use.
 * @param comparePeriod The compare length
 * @returns The duration to compare
 */
export function calculateCompareDuration(comparePeriod: ComparePeriod): moment.Duration {
	let compareDuration;
	switch (comparePeriod) {
		case ComparePeriod.Day:
			// fetch hours for accuracy when time interval is small
			compareDuration = moment.duration(1, 'hours');
			break;
		case ComparePeriod.Week:
			compareDuration = moment.duration(1, 'days');
			break;
		case ComparePeriod.FourWeeks:
			compareDuration = moment.duration(28, 'days');
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
	return compareDuration;
}

/**
 * Calculates amount of time to shift as a moment duration
 * @param comparePeriod The compare length
 * @returns The shift as a moment duration
 */
export function calculateCompareShift(comparePeriod: ComparePeriod): moment.Duration {
	let compareShift;
	switch (comparePeriod) {
		case ComparePeriod.Day:
			// fetch hours for accuracy when time interval is small
			compareShift = moment.duration(1, 'days');
			break;
		case ComparePeriod.Week:
			compareShift = moment.duration(7, 'days');
			break;
		case ComparePeriod.FourWeeks:
			compareShift = moment.duration(28, 'days');
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
	return compareShift;
}

export interface ComparePeriodLabels {
	current: string;
	prev: string;
}

/**
 * Determines the human-readable names of a comparison period.
 * @param comparePeriod the machine-readable name of the period
 * @returns human-readable names for the compare period as {{prev: string, current: string}}
 */
export function getComparePeriodLabels(comparePeriod: ComparePeriod): ComparePeriodLabels {
	switch (comparePeriod) {
		case ComparePeriod.Day:
			return { prev: translate('yesterday'), current: translate('today') };
		case ComparePeriod.Week:
			return { prev: translate('last.week'), current: translate('this.week') };
		case ComparePeriod.FourWeeks:
			return { prev: translate('last.four.weeks'), current: translate('this.four.weeks') };
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}

}

/**
 * Composes a label to summarize compare chart data.
 * @param change the ratio of change between the current and previous period
 * @param name the name of the entity being measured
 * @param labels the names of the periods in question as {{prev: string, current: string}}
 * @returns The label summary
 */
export function getCompareChangeSummary(change: number, name: string, labels: ComparePeriodLabels): string {
	if (isNaN(change)) {
		return `${name} ${translate('has.no.data')}`;
	}
	const percent = parseInt(change.toFixed(2).replace('.', ''));
	if (change < 0) {
		return `${name} ${translate('has.used')} ${percent}% ${translate('less.energy')} ${labels.current.toLocaleLowerCase()}`;
	} else {
		return `${name} ${translate('has.used')} ${percent}% ${translate('more.energy')} ${labels.current.toLocaleLowerCase()}`;
	}
}
