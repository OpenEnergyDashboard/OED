/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as moment from 'moment';

export class TimeInterval {
	public static unbounded(): TimeInterval;
	public static fromString(stringified: string): TimeInterval;

	public constructor(startTimestamp: moment.Moment, endTimestamp: moment.Moment);
	public toString(): string;
	public equals(other: TimeInterval): boolean;
	public contains(other: TimeInterval): boolean;
	public valueOf(): string;
	public duration(specifier: string): number;
}
