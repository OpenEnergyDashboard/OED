/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BarReadingsAction, BarReadingsState } from '../types/redux/barReadings';
import { ActionType } from '../types/redux/actions';

const defaultState: BarReadingsState = {
	byMeterID: {},
	byGroupID: {},
	isFetching: false,
	metersFetching: false,
	groupsFetching: false
};

export default function readings(state = defaultState, action: BarReadingsAction) {
	switch (action.type) {
		case ActionType.RequestMeterBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const unitID = action.unitID;
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
				if (newState.byMeterID[meterID][timeInterval][barDuration] === undefined) {
					newState.byMeterID[meterID][timeInterval][barDuration] = {};
				}

				// Retain existing data if there is any
				if (newState.byMeterID[meterID][timeInterval][barDuration][unitID] === undefined) {
					newState.byMeterID[meterID][timeInterval][barDuration][unitID] = { isFetching: true };
				} else {
					newState.byMeterID[meterID][timeInterval][barDuration][unitID] = { ...newState.byMeterID[meterID][timeInterval][barDuration][unitID], isFetching: true };
				}
			}

			return newState;
		}
		case ActionType.RequestGroupBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const unitID = action.unitID;
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
				if (newState.byGroupID[groupID][timeInterval] === undefined) {
					newState.byGroupID[groupID][timeInterval] = {};
				}
				if (newState.byGroupID[groupID][timeInterval][barDuration] === undefined) {
					newState.byGroupID[groupID][timeInterval][barDuration] = {};
				}

				// Retain existing data if there is any
				if (newState.byGroupID[groupID][timeInterval][barDuration][unitID] === undefined) {
					newState.byGroupID[groupID][timeInterval][barDuration][unitID] = { isFetching: true };
				} else {
					newState.byGroupID[groupID][timeInterval][barDuration][unitID] = { ...newState.byGroupID[groupID][timeInterval][barDuration][unitID], isFetching: true };
				}
			}

			return newState;
		}
		case ActionType.ReceiveMeterBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const unitID = action.unitID;
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				},
				metersFetching: false
			};

			for (const meterID of action.meterIDs) {
				const readingsForMeter = action.readings[meterID];
				newState.byMeterID[meterID][timeInterval][barDuration][unitID] = { isFetching: false, readings: readingsForMeter };
			}
			if (!state.groupsFetching) {
				newState.isFetching = false;
			}

			return newState;
		}
		case ActionType.ReceiveGroupBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const unitID = action.unitID;
			const newState = {
				...state,
				byGroupID: {
					...state.byGroupID
				},
				groupsFetching: false
			};

			for (const groupID of action.groupIDs) {
				const readingsForGroup = action.readings[groupID];
				newState.byGroupID[groupID][timeInterval][barDuration][unitID] = { isFetching: false, readings: readingsForGroup };
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
