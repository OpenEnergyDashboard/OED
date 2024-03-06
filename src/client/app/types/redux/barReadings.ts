/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BarReading } from '../readings';

export interface BarReadingsState {
	byMeterID: {
		[meterID: number]: {
			[timeInterval: string]: {
				[barDuration: string]: {
					[unitID: number]: {
						isFetching: boolean;
						readings?: BarReading[];
					}
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[barDuration: string]: {
					[unitID: number]: {
						isFetching: boolean;
						readings?: BarReading[];
					}
				}
			}
		}
	};
	isFetching: boolean;
	metersFetching: boolean;
	groupsFetching: boolean;
}
