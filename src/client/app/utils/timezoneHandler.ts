/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment-timezone';
import {State} from '../types/redux/state';

/**
 * transform the timezone setting fetched from database to a valid timezone
 * @param timezone Timezone in the database for admin
 */
// export async function transformToServerTimeIfNeeded(timezone: string): Promise<string> {
// 	let useTimezone;
// 	if (!isValidTimezone(timezone)) {
// 		const serverInfo = await serverInfoApi.getServerInfo();
// 		useTimezone = serverInfo.timezone;
// 	} else {
// 		useTimezone = timezone;
// 	}
// 	return useTimezone;
// }

/**
 * recreate a timestamp created in default timezone(UTC) with its true timezone
 */
export function changeTimezoneOffset(origin: number, targetZone: string): moment.Moment {
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

/**
 * Parse timestamp with meter's timezone, if meter does not hava a set timezone, set with site's time;
 * @param timestamp
 * @param meterID
 * @param state
 */
// export function toMeterTime(timestamp: moment.Moment, meterID: number, state: State): moment.Moment {
// 	const meterTimezone = state.meters.byMeterID[meterID].timezone;
// 	const siteTimezone = state.admin.defaultTimezone;
// 	return (meterTimezone) ? moment.tz(timestamp, meterTimezone) : moment.tz(timestamp, siteTimezone);
// }

/**
 * parses moment back to server's timezone(not sure if necessary yet)
 */
export function toServerTime(meterTime: moment.Moment, state: State): moment.Moment {
	return moment(meterTime);
}
