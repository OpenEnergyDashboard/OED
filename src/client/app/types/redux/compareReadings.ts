/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { CompareReadings } from '../readings';

export interface RequestMeterCompareReadingsAction {
	type: ActionType.RequestMeterCompareReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
}

export interface RequestGroupCompareReadingsAction {
	type: ActionType.RequestGroupCompareReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
}

export interface ReceiveMeterCompareReadingsAction {
	type: ActionType.ReceiveMeterCompareReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
	readings: CompareReadings;
}

export interface ReceiveGroupCompareReadingsAction {
	type: ActionType.ReceiveGroupCompareReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
	readings: CompareReadings;
}

export type CompareReadingsAction =
	ReceiveMeterCompareReadingsAction |
	ReceiveGroupCompareReadingsAction |
	RequestMeterCompareReadingsAction |
	RequestGroupCompareReadingsAction;

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
