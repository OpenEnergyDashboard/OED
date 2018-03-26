/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { BarReadings } from '../readings';
import {CompressedBarReading, CompressedBarReadings} from '../compressed-readings';

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
	readings: CompressedBarReadings;
}

export interface ReceiveGroupBarReadingsAction {
	type: ActionType.ReceiveGroupBarReadings;
	groupIDs: number[];
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
	readings: CompressedBarReadings;
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
					readings?: CompressedBarReading[];
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[barDuration: string]: {
					isFetching: boolean;
					readings?: CompressedBarReading[];
				}
			}
		}
	};
}
