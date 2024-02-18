/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { BarReading, BarReadings } from '../readings';

export interface RequestMeterBarReadingsAction {
	type: ActionType.RequestMeterBarReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
}

export interface RequestGroupBarReadingsAction {
	type: ActionType.RequestGroupBarReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
}

export interface ReceiveMeterBarReadingsAction {
	type: ActionType.ReceiveMeterBarReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
	readings: BarReadings;
}

export interface ReceiveGroupBarReadingsAction {
	type: ActionType.ReceiveGroupBarReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
	readings: BarReadings;
}

export type BarReadingsAction =
	ReceiveMeterBarReadingsAction |
	ReceiveGroupBarReadingsAction |
	RequestMeterBarReadingsAction |
	RequestGroupBarReadingsAction;

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
