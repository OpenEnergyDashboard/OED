import {CompressedLineReading} from '../compressed-readings';

export interface CompareReadings {
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
