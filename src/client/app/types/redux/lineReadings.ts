/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LineReading } from '../readings';

export interface LineReadingsState {
	byMeterID: {
		[meterID: number]: {
			[timeInterval: string]: {
				[unitID: number]: {
					isFetching: boolean;
					readings?: LineReading[];
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[unitID: number]: {
					isFetching: boolean;
					readings?: LineReading[];
				}
			}
		}
	};
	isFetching: boolean;
	metersFetching: boolean;
	groupsFetching: boolean;
}
