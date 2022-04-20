/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import {LineReading, LineReadings} from '../readings';

export interface RequestMeterLineReadingsAction {
	type: ActionType.RequestMeterLineReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
}

export interface RequestGroupLineReadingsAction {
	type: ActionType.RequestGroupLineReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
}

export interface ReceiveMeterLineReadingsAction {
	type: ActionType.ReceiveMeterLineReadings;
	meterIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	readings: LineReadings;
}

export interface ReceiveGroupLineReadingsAction {
	type: ActionType.ReceiveGroupLineReadings;
	groupIDs: number[];
	unitID: number;
	timeInterval: TimeInterval;
	readings: LineReadings;
}

export type LineReadingsAction =
	ReceiveMeterLineReadingsAction |
	ReceiveGroupLineReadingsAction |
	RequestMeterLineReadingsAction |
	RequestGroupLineReadingsAction;

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
