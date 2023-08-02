/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { RadarReading, RadarReadings } from '../readings';

export interface RequestMeterRadarReadingAction {
	type: ActionType.RequestMeterRadarReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
}

export interface RequestGroupRadarReadingAction {
	type: ActionType.RequestGroupRadarReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
}

export interface ReceiveMeterRadarReadingAction {
	type: ActionType.ReceiveMeterRadarReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	readings: RadarReadings;
}

export interface ReceiveGroupRadarReadingAction {
	type: ActionType.ReceiveGroupRadarReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	readings: RadarReadings;
}

export type RadarReadingState =
    RequestMeterRadarReadingAction |
    RequestGroupRadarReadingAction |
    ReceiveMeterRadarReadingAction |
    ReceiveGroupRadarReadingAction;

export interface RadarReadingsState {
	byMeterID: {
		[meterID: number]: {
			[timeInterval: string]: {
				[unitID: number]: {
					isFetching: boolean;
					readings?: RadarReading[];
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[unitID: number]: {
					isFetching: boolean;
					readings?: RadarReading[];
				}
			}
		}
	};
	isFetching: boolean;
	metersFetching: boolean;
	groupsFetching: boolean;
}
