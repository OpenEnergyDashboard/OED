import { CompareReadingAction, CompareReadingsState } from '../types/redux/compareReadings';
import { ActionType } from '../types/redux/actions';

const defaultState: CompareReadingsState = {
	byMeterID: {},
	byGroupID: {},
	isFetching: false,
		metersFetching: false,
		groupsFetching: false
};

export default function readings(state = defaultState, action: CompareReadingAction) {
	const timeInterval = action.timeInterval.toString();
	const compareShift = action.compareShift.toISOString();
	switch (action.type) {
		case ActionType.RequestMeterCompareReading: {
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				},
				metersFetching: true,
				isFetching: true
			};
			for (const meterID of action.meterIDs) {
				// Create group entry and time interval entry if needed
				if (newState.byMeterID[meterID] === undefined) {
					newState.byMeterID[meterID] = {};
				}
				if (newState.byMeterID[meterID][timeInterval] === undefined) {
					newState.byMeterID[meterID][timeInterval] = {};
				}
				// Retain existing data if there is any
				if (newState.byMeterID[meterID][timeInterval][compareShift] === undefined) {
					newState.byMeterID[meterID][timeInterval][compareShift] = { isFetching: true };
				} else {
					newState.byMeterID[meterID][timeInterval][compareShift] = { ...newState.byMeterID[meterID][timeInterval][compareShift], isFetching: true };
				}
			}
			return newState;
		}
		case ActionType.RequestGroupCompareReading: {
			const newState = {
				...state,
				byGroupID: {
					...state.byGroupID
				},
				groupsFetching: true,
				isFetching: true
			};
			for (const groupID of action.groupIDs) {
				// Create group entry and time interval entry if needed
				if (newState.byGroupID[groupID] === undefined) {
					newState.byGroupID[groupID] = {};
				}
				// Retain existing data if there is any
				if (newState.byGroupID[groupID][timeInterval] === undefined) {
					newState.byGroupID[groupID][timeInterval] = {};
				}
				if (newState.byGroupID[groupID][timeInterval][compareShift] === undefined) {
					newState.byGroupID[groupID][timeInterval][compareShift] = { isFetching: true };
				} else {
					newState.byGroupID[groupID][timeInterval][compareShift] = { ...newState.byGroupID[groupID][timeInterval][compareShift], isFetching: true };
				}
			}
			return newState;
		}
		case ActionType.ReceiveMeterCompareReading: {
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				},
				metersFetching: false
			};
			for (const meterID of action.meterIDs) {
				const readingForMeter = action.readings[meterID];
				newState.byMeterID[meterID][timeInterval][compareShift] = { isFetching: false, reading: readingForMeter };
			}
			if (!state.groupsFetching) {
				newState.isFetching = false;
			}
			return newState;
		}
		case ActionType.ReceiveGroupCompareReading: {
			const newState = {
				...state,
				byGroupID: {
					...state.byGroupID
				},
				groupsFetching: false
			};
			for (const groupID of action.groupIDs) {
				const readingForGroup = action.readings[groupID];
				newState.byGroupID[groupID][timeInterval][compareShift] = { isFetching: false, reading: readingForGroup };
			}
			if (!state.metersFetching) {
				newState.isFetching = false;
			}
			return newState;
		}
		default:
			return state;
	}
}
