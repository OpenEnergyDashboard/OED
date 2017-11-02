/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as moment from 'moment';

export default class TimeInterval {
	constructor(startTimestamp: moment.Moment, endTimestamp: moment.Moment);
	toString(): string;
	equals(other: TimeInterval): boolean;
	valueOf(): string;
	static unbounded(): TimeInterval;
	static fromString(stringified: string): TimeInterval;
}
