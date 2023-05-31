/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';

/**
 * Returns the string interval formatted for display. Normally this
 * is the interval returned by Postgres.
 * @param {string} durationToFormat The moment duration to format
 * @returns The string formatted with day(s) hh:mm:ss.
 */
export function durationFormat(durationPassed: string): string {
	// Convert the string to milliseconds via moment Duration.
	// This is needed for formatting and takes care of the Postgres
	// format automatically.
	const ms = moment.duration(durationPassed).asMilliseconds();
	// Because moment will only print up to 23 hours, we calculate the days separately.
	// Divide by 1000 ms/sec * 60 sec/min * 60 min/hour = 3600000 ms/hour.
	// Then convert to whole hours where lose any fractional part.
	const hours = Math.trunc(ms / 3600000);
	// The nicely formatted interval.
	let finalString = '';
	// The number of days.
	const numDays = Math.trunc(hours / 24);
	if (numDays > 0) {
		// There is more than one day so format it nicely.
		finalString += numDays + ' ';
		if (numDays === 1) {
			finalString += 'day';
			// It would be nice to translate this but then the save to the DB fails so not allow for now.
			// finalString += translate('day');
		} else {
			finalString += 'days';
			// It would be nice to translate this but then the save to the DB fails so not allow for now.
			// finalString += translate('days');
		}
		finalString += ' ';
	}
	// Now add the hours to the string after the hours in the days are removed.
	finalString += hours - numDays * 24;
	// the mm:ss via formatting by moment separated by a : and return this final result.
	return finalString + ':' + moment.utc(ms).format('mm:ss');
}
