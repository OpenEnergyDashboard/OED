/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeInterval } from '../../../../common/TimeInterval';
import { LineReadings } from '../readings';
import { ActionType } from './actions';
import {CompressedLineReading, CompressedLineReadings} from '../compressed-readings';

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
	readings: CompressedLineReadings;
}

export interface ReceiveGroupLineReadingsAction {
	type: ActionType.ReceiveGroupLineReadings;
	groupIDs: number[];
	timeInterval: TimeInterval;
	readings: CompressedLineReadings;
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
				readings?: CompressedLineReading[];
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				isFetching: boolean;
				readings?: CompressedLineReading[];
			}
		}
	};
	isFetching: boolean;
	metersFetching: boolean;
	groupsFetching: boolean;
}
