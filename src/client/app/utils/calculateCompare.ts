/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';
import { State } from '../types/redux/state';

// TODO make a comparePeriod enum

export function calculateCompareTimeInterval(comparePeriod: string): TimeInterval {
	let compareTimeInterval;
	switch (comparePeriod) {
		case 'day':
			compareTimeInterval = new TimeInterval(moment().subtract(2, 'days'), moment());
			break;
		case 'week':
			compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(7, 'days'), moment());
			break;
		case 'month':
			compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(49, 'days'), moment());
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
	return compareTimeInterval;
}

export function calculateCompareDuration(comparePeriod: string): moment.Duration {
	let compareDuration;
	switch (comparePeriod) {
		case 'day':
			// fetch hours for accuracy when time interval is small
			compareDuration = moment.duration(1, 'hours');
			break;
		case 'week':
			compareDuration = moment.duration(1, 'days');
			break;
		case 'month':
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
export function getComparePeriodLabels(comparePeriod: string): ComparePeriodLabels {
	switch (comparePeriod) {
		case 'day':
			return {prev: 'Yesterday', current: 'Today'};
		case 'week':
			return {prev: 'Last week', current: 'This week'};
		case 'month':
			return {prev: 'Last four weeks', current: 'This four weeks'};
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
export function getCompareChangeSummary(change: number, name: string, labels: ComparePeriodLabels) {
	const percent = parseInt(change.toFixed(2).replace('.', '').slice(1));
	if (isNaN(change)) { return ''; }
	if (change < 0) {
		return `${name} has used ${percent}% less energy ${labels.current.toLocaleLowerCase()}`;
	} else {
		return `${name} has used ${percent}% more energy ${labels.current.toLocaleLowerCase()}`;
	}
}
