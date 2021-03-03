/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment-timezone';
import {State} from '../types/redux/state';

// TODO: These are not currently used but leaving in case new export feature needs them. They might
// be removed in the future.

/**
 * recreate a timestamp created in default timezone(UTC) with its true timezone
 * this is invoked only when the user wishes to export data in their absolute time in UNIX timestamps
 */
export function recreateTimezoneOffset(origin: number, targetZone: string): moment.Moment {
	const localDate = moment(origin).utc().format().substring(0, 19);
	return moment.tz(localDate, targetZone);
}

/**
 * Checks if moment-timezone can recognize the provided timezone name
 * @param timezone
 */
function isValidTimezone(timezone: string): boolean {
	const list = moment.tz.names();
	return list.includes(timezone);
}
