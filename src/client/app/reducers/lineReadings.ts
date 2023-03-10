/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from '../types/redux/actions';
import { LineReadingsAction, LineReadingsState } from '../types/redux/lineReadings';

const defaultState: LineReadingsState = {
	byMeterID: {},
	byGroupID: {},
	isFetching: false,
	metersFetching: false,
	groupsFetching: false
};

/* eslint-disable */

export default function readings(state = defaultState, action: LineReadingsAction) {
	switch (action.type) {
		case ActionType.RequestMeterLineReadings: {
			const timeInterval = action.timeInterval.toString();
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
				// Create meter wrapper if needed
				if (newState.byMeterID[meterID] === undefined) {
					newState.byMeterID[meterID] = {};
				}
				if (newState.byMeterID[meterID][timeInterval] === undefined) {
					newState.byMeterID[meterID][timeInterval] = {};
				}

				// Preserve existing data
				if (newState.byMeterID[meterID][timeInterval][unitID] === undefined) {
					newState.byMeterID[meterID][timeInterval][unitID] = { isFetching: true };
				} else {
					newState.byMeterID[meterID][timeInterval][unitID] = { ...newState.byMeterID[meterID][timeInterval][unitID], isFetching: true };
				}
			}
			return newState;
		}
		case ActionType.RequestGroupLineReadings: {
			const timeInterval = action.timeInterval.toString();
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
				// Create group wrapper
				if (newState.byGroupID[groupID] === undefined) {
					newState.byGroupID[groupID] = {};
				}
				if (newState.byGroupID[groupID][timeInterval] === undefined) {
					newState.byGroupID[groupID][timeInterval] = {};
				}

				// Preserve existing data
				if (newState.byGroupID[groupID][timeInterval][unitID] === undefined) {
					newState.byGroupID[groupID][timeInterval][unitID] = { isFetching: true };
				} else {
					newState.byGroupID[groupID][timeInterval][unitID] = { ...newState.byGroupID[groupID][timeInterval][unitID], isFetching: true };
				}
			}
			return newState;
		}
		case ActionType.ReceiveMeterLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const newState: LineReadingsState = {
				...state,
				byMeterID: {
					...state.byMeterID
				},
				metersFetching: false
			};

			for (const meterID of action.meterIDs) {
				const readingsForMeter = action.readings[meterID];
				newState.byMeterID[meterID][timeInterval][unitID] = { isFetching: false, readings: readingsForMeter };
			}
			if (!state.groupsFetching) {
				newState.isFetching = false;
			}

			return newState;
		}
		case ActionType.ReceiveGroupLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const unitID = action.unitID;
			const newState: LineReadingsState = {
				...state,
				byGroupID: {
					...state.byGroupID
				},
				groupsFetching: false
			};

			for (const groupID of action.groupIDs) {
				const readingsForGroup = action.readings[groupID];
				newState.byGroupID[groupID][timeInterval][unitID] = { isFetching: false, readings: readingsForGroup };
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
