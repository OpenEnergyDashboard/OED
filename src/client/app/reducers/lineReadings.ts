
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as readingsActions from '../actions/lineReadings';
import { ActionType } from '../types/redux';

/**
 * @typedef {Object} State~BarReadings
 * @property {Object<number, Object>} byMeterID
 */

/**
 * @type {State~Readings}
 */
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

const defaultState: LineReadingsState = {
	byMeterID: {},
	byGroupID: {}
};

/**
 * @param {State~Readings} state
 * @param action
 * @return {State~Readings}
 */
export default function readings(state = defaultState, action: readingsActions.LineReadingsAction) {
	switch (action.type) {
		case ActionType.RequestMeterLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				}
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
				}
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
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				}
			};

			for (const meterID of action.meterIDs) {
				const readingsForMeter = action.readings[meterID];
				newState.byMeterID[meterID][timeInterval] = { isFetching: false, readings: readingsForMeter };
			}
			return newState;
		}
		case ActionType.ReceiveGroupLineReadings: {
			const timeInterval = action.timeInterval.toString();
			const newState = {
				...state,
				byGroupID: {
					...state.byGroupID
				}
			};

			for (const groupID of action.groupIDs) {
				const readingsForGroup = action.readings[groupID];
				newState.byGroupID[groupID][timeInterval] = { isFetching: false, readings: readingsForGroup };
			}

			return newState;
		}
		default:
			return state;
	}
}
