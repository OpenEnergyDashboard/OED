/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';

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
