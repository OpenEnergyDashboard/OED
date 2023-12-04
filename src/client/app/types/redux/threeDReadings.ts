/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { ThreeDReading } from '../readings';
import { ReadingInterval } from './graph';

export interface RequestMeterThreeDReadingsAction {
	type: ActionType.RequestMeterThreeDReadings;
	meterID: number;
	unitID: number;
	timeInterval: TimeInterval;
	readingInterval: ReadingInterval;
}

export interface ReceiveMeterThreeDReadingsAction {
	type: ActionType.ReceiveMeterThreeDReadings;
	meterID: number;
	unitID: number;
	timeInterval: TimeInterval;
	readingInterval: ReadingInterval;
	readings: ThreeDReading;
}
export interface RequestGroupThreeDReadingsAction {
	type: ActionType.RequestGroupThreeDReadings;
	groupID: number;
	unitID: number;
	timeInterval: TimeInterval;
	readingInterval: ReadingInterval;
}

export interface ReceiveGroupThreeDReadingsAction {
	type: ActionType.ReceiveGroupThreeDReadings;
	groupID: number;
	unitID: number;
	timeInterval: TimeInterval;
	readingInterval: ReadingInterval;
	readings: ThreeDReading;
}


export type ThreeDReadingsAction =
	ReceiveMeterThreeDReadingsAction |
	RequestMeterThreeDReadingsAction |
	RequestGroupThreeDReadingsAction |
	ReceiveGroupThreeDReadingsAction;

export interface ThreeDReadingsState {
	byMeterID: {
		[meterID: number]: {
			[timeInterval: string]: {
				[unitID: number]: {
					[readingInterval: string]: {
						isFetching: boolean;
						readings?: ThreeDReading;
					}
				}
			}
		}
	};

	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[unitID: number]: {
					[readingInterval: string]: {
						isFetching: boolean;
						readings?: ThreeDReading;
					}
				}
			}
		}
	};

	isFetching: boolean;
	metersFetching: boolean;
}
