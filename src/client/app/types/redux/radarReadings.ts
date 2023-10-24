/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { LineReading, LineReadings } from '../readings';

export interface RequestMeterRadarReadingAction {
	type: ActionType.RequestMeterLineReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
}

export interface RequestGroupRadarReadingAction {
	type: ActionType.RequestGroupLineReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
}

export interface ReceiveMeterRadarReadingAction {
	type: ActionType.ReceiveMeterLineReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	readings: LineReadings;
}

export interface ReceiveGroupRadarReadingAction {
	type: ActionType.ReceiveGroupLineReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	readings: LineReadings;
}

export type RadarReadingsAction =
	RequestMeterRadarReadingAction |
	RequestGroupRadarReadingAction |
	ReceiveMeterRadarReadingAction |
	ReceiveGroupRadarReadingAction;


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
