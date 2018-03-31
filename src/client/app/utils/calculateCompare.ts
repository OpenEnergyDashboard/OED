/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';

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
	switch (comparePeriod) {
		case ComparePeriod.Day:
			compareTimeInterval = new TimeInterval(moment().subtract(2, 'days'), currentTime);
			break;
		case ComparePeriod.Week:
			compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(7, 'days'), currentTime);
			break;
		case ComparePeriod.FourWeeks:
			compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(49, 'days'), currentTime);
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
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
			compareDuration = moment.duration(1, 'days');
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
	return compareDuration;
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
			return { prev: 'Yesterday', current: 'Today' };
		case ComparePeriod.Week:
			return { prev: 'Last Week', current: 'This Week' };
		case ComparePeriod.FourWeeks:
			return { prev: 'Last four weeks', current: 'This four weeks' };
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}

}

/**
 * Composes a label to summarize compare chart data.
 * @param change the radio of change between the current and previous period
 * @param name the name of the entity being measured
 * @param labels the names of the periods in question
 */
export function getCompareChangeSummary(change: number, name: string, labels: ComparePeriodLabels): string {
	if (isNaN(change)) { return ''; }
	const percent = parseInt(change.toFixed(2).replace('.', '').slice(1));
	if (change < 0) {
		return `${name} has used ${percent}% less energy ${labels.current.toLocaleLowerCase()}`;
	} else {
		return `${name} has used ${percent}% more energy ${labels.current.toLocaleLowerCase()}`;
	}
}
