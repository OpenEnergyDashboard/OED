/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LineReadingsAction, LineReadingsState } from '../types/redux/lineReadings';
import { ActionType } from '../types/redux/actions';

const defaultState: LineReadingsState = {
	byMeterID: {},
	byGroupID: {},
	isFetching: false,
	metersFetching: false,
	groupsFetching: false
};

export default function readings(state = defaultState, action: LineReadingsAction) {
	switch (action.type) {
		case ActionType.RequestMeterLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				},
				metersFetching: true,
				isFetching: true
			};

			for (const meterID of action.meterIDs) {
				// Create meter wrapper if needed
				if (newState.byMeterID[meterID] === undefined) {
					newState.byMeterID[meterID] = {};
				}

				// Preserve existing data
				if (newState.byMeterID[meterID][timeInterval] === undefined) {
					newState.byMeterID[meterID][timeInterval] = { isFetching: true };
				} else {
					newState.byMeterID[meterID][timeInterval] = { ...newState.byMeterID[meterID][timeInterval], isFetching: true };
				}
			}
			return newState;
		}
		case ActionType.RequestGroupLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const newState = {
				...state,
				byGroupID: {
					...state.byGroupID
				},
				groupsFetching: true,
				isFetching: true
			};

			for (const groupID of action.groupIDs) {
				// Create group wrapper
				if (newState.byGroupID[groupID] === undefined) {
					newState.byGroupID[groupID] = {};
				}

				// Preserve existing data
				if (newState.byGroupID[groupID][timeInterval] === undefined) {
					newState.byGroupID[groupID][timeInterval] = { isFetching: true };
				} else {
					newState.byGroupID[groupID][timeInterval] = { ...newState.byGroupID[groupID][timeInterval], isFetching: true };
				}
			}
			return newState;
		}
		case ActionType.ReceiveMeterLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const newState: LineReadingsState = {
				...state,
				byMeterID: {
					...state.byMeterID
				}
			};

			for (const meterID of action.meterIDs) {
				const readingsForMeter = action.readings[meterID];
				newState.byMeterID[meterID][timeInterval] = { isFetching: false, readings: readingsForMeter };
			}
			if (!state.groupsFetching) {
				newState.isFetching = false;
			}

			return newState;
		}
		case ActionType.ReceiveGroupLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const newState: LineReadingsState = {
				...state,
				byGroupID: {
					...state.byGroupID
				},
				groupsFetching: false
			};

			for (const groupID of action.groupIDs) {
				const readingsForGroup = action.readings[groupID];
				newState.byGroupID[groupID][timeInterval] = { isFetching: false, readings: readingsForGroup };
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
