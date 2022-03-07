/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';
import translate from '../utils/translate';

export enum ComparePeriod {
	Day = 'Day',
	Week = 'Week',
	FourWeeks = 'FourWeeks'
}

export enum SortingOrder {
	Alphabetical = 'Alphabetical',
	Ascending = 'Ascending',
	Descending = 'Descending'
}

export function validateComparePeriod(comparePeriod: string): ComparePeriod {
	switch (comparePeriod) {
		case 'Day':
			return ComparePeriod.Day;
		case 'Week':
			return ComparePeriod.Week;
		case 'FourWeeks':
			return ComparePeriod.FourWeeks;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
}

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

export function calculateCompareTimeInterval(comparePeriod: ComparePeriod, currentTime: moment.Moment): TimeInterval {
	let compareTimeInterval;
	// Moment changes the times by shifting to local (client/browser) timezone. To fix this up, we need
	// to know the shift between UTC and local timezone. The value below is the time in minutes that
	// must be added to go from UTC to local time. For example, for CST it is -360 (Central U.S.A.
	// without daylight savings) since CST is 6 hours behind UTC.
	const utcShift = moment().utcOffset();
	// begin will be the start of the compare time and end will be the end of the compare time.
	let begin;
	// OED uses hourly/daily view data to get comparisons so it is only accurate to the last hour.
	// By setting the end time to the hour it works properly and avoids changing with each request
	// within the same hour. This avoids updating the Redux state so it is faster.
	// You also get an error with groups at times because the state was not to the hour but the final
	// time used to get the state was the start of the hour. This fixes that.
	const end = currentTime.add(utcShift, 'minutes').startOf('hour');
	switch (comparePeriod) {
		case ComparePeriod.Day:
			// We need to shift all the times by utcShift because later on they will be shifted back.
			// begin is the start of the day (shifted) and end is the current time (shifted).
			// The range is one day without any time remaining in this day to the previous hour.
			begin = moment().startOf('day').add(utcShift, 'minutes');
			break;
		case ComparePeriod.Week:
			// We need to shift all the times by utcShift because later on they will be shifted back.
			// begin is the start of the day on last Sunday (shifted) and end is the current time (shifted).
			// The range is one week without any time remaining in this week to the previous hour.
			begin = moment().startOf('week').add(utcShift, 'minutes');
			break;
		case ComparePeriod.FourWeeks:
			// We need to shift all the times by utcShift because later on they will be shifted back.
			// begin is the start of the day on Sunday three weeks earlier than the Sunday of this week (shifted)
			// and end is the current time (shifted). The range of time used is or four weeks without any time
			// remaining in this week  to the previous hour.
			begin = moment().startOf('week').subtract(3, 'weeks').add(utcShift, 'minutes');
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
	compareTimeInterval = new TimeInterval(begin, end);
	return compareTimeInterval;
}

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
 * @param labels the names of the periods in question
 */
export function getCompareChangeSummary(change: number, name: string, labels: ComparePeriodLabels): string {
	if (isNaN(change)) { return ''; }
	const percent = parseInt(change.toFixed(2).replace('.', ''));
	if (change < 0) {
		return `${name} ${translate('has.used')} ${percent}% ${translate('less.energy')} ${labels.current.toLocaleLowerCase()}`;
	} else {
		return `${name} ${translate('has.used')} ${percent}% ${translate('more.energy')} ${labels.current.toLocaleLowerCase()}`;
	}
}
