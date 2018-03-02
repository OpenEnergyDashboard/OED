/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { BarReadings } from '../readings';

export interface RequestMeterBarReadingsAction {
	type: ActionType.RequestMeterBarReadings;
	meterIDs: number[];
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
}

export interface RequestGroupBarReadingsAction {
	type: ActionType.RequestGroupBarReadings;
	groupIDs: number[];
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
}

export interface ReceiveMeterBarReadingsAction {
	type: ActionType.ReceiveMeterBarReadings;
	meterIDs: number[];
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
	readings: BarReadings;
}

export interface ReceiveGroupBarReadingsAction {
	type: ActionType.ReceiveGroupBarReadings;
	groupIDs: number[];
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
					isFetching: boolean;
					readings?: Array<[number, number]>;
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[barDuration: string]: {
					isFetching: boolean;
					readings?: Array<[number, number]>;
				}
			}
		}
	};
	isFetching: boolean;
	metersFetching: boolean;
	groupsFetching: boolean;
}
