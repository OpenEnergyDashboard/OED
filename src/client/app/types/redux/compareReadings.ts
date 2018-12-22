import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { CompareReadings } from '../readings';

export interface RequestMeterCompareReadingAction {
	type: ActionType.RequestMeterCompareReading;
	meterIDs: number[];
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
}

export interface RequestGroupCompareReadingAction {
	type: ActionType.RequestGroupCompareReading;
	groupIDs: number[];
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
}

export interface ReceiveMeterCompareReadingAction {
	type: ActionType.ReceiveMeterCompareReading;
	meterIDs: number[];
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
	readings: CompareReadings;
}

export interface ReceiveGroupCompareReadingAction {
	type: ActionType.ReceiveGroupCompareReading;
	groupIDs: number[];
	timeInterval: TimeInterval;
	compareShift: moment.Duration;
	readings: CompareReadings;
}

export type CompareReadingAction =
	ReceiveMeterCompareReadingAction |
	ReceiveGroupCompareReadingAction |
	RequestMeterCompareReadingAction |
	RequestGroupCompareReadingAction;

export interface CompareReadingsState {
	byMeterID: {
		[meterID: number]: {
			[timeInterval: string]: {
				[compareShift: string]: {
					isFetching: boolean;
					curr_use?: number;
					prev_use?: number;
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[compareShift: string]: {
					isFetching: boolean;
					curr_use?: number;
					prev_use?: number;
				}
			}
		}
	};
	isFetching: boolean;
	metersFetching: boolean;
	groupsFetching: boolean;
}
