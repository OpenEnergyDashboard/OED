/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface CompareReadingsData {
	isFetching: boolean;
	curr_use?: number;
	prev_use?: number;
}

export interface CompareReadingsState {
	byMeterID: {
		[meterID: number]: {
			[timeInterval: string]: {
				[compareShift: string]: {
					[unitID: number]: CompareReadingsData;
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[compareShift: string]: {
					[unitID: number]: CompareReadingsData;
				}
			}
		}
	};
	isFetching: boolean;
	metersFetching: boolean;
	groupsFetching: boolean;
}
