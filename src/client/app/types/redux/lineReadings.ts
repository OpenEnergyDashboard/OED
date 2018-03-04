/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../../common/TimeInterval';
import { LineReadings } from '../readings';
import { ActionType } from './actions';

export interface RequestMeterLineReadingsAction {
	type: ActionType.RequestMeterLineReadings;
	meterIDs: number[];
	timeInterval: TimeInterval;
}

export interface RequestGroupLineReadingsAction {
	type: ActionType.RequestGroupLineReadings;
	groupIDs: number[];
	timeInterval: TimeInterval;
}

export interface ReceiveMeterLineReadingsAction {
	type: ActionType.ReceiveMeterLineReadings;
	meterIDs: number[];
	timeInterval: TimeInterval;
	readings: LineReadings;
}

export interface ReceiveGroupLineReadingsAction {
	type: ActionType.ReceiveGroupLineReadings;
	groupIDs: number[];
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
				isFetching: boolean;
				readings?: {
					[point: number]: [number, number];
				};
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				isFetching: boolean;
				readings?: {
					[point: number]: [number, number];
				};
			}
		}
	};
}
