
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as readingsActions from '../actions/barReadings';
import { BarReadingsAction } from '../actions/barReadings';
import { ActionType } from '../types/redux';

/**
 * @typedef {Object} State~BarReadings
 * @property {Object<number, Object>} byMeterID
 */

export interface BarReadingsState {
	byMeterID: {
		[meterID: number]: {
			[timeInterval: string]: {
				[barDuration: string]: {
					isFetching: boolean;
					readings?: Array<[number, number]>;
				}
			}
		}
	};
	byGroupID: {
		[groupID: number]: {
			[timeInterval: string]: {
				[barDuration: string]: {
					isFetching: boolean;
					readings?: Array<[number, number]>;
				}
			}
		}
	};
}

/**
 * @type {State~BarReadings}
 */
const defaultState: BarReadingsState = {
	byMeterID: {},
	byGroupID: {}
};

/**
 * @param {State~Readings} state
 * @param action
 * @return {State~Readings}
 */
export default function readings(state = defaultState, action: BarReadingsAction) {
	switch (action.type) {
		case ActionType.RequestMeterBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				}
			};

			for (const meterID of action.meterIDs) {
				if (newState.byMeterID[meterID] === undefined) {
					newState.byMeterID[meterID] = {};
				}
				if (newState.byMeterID[meterID][timeInterval] === undefined) {
					newState.byMeterID[meterID][timeInterval] = {};
				} else if (newState.byMeterID[meterID][timeInterval][barDuration] === undefined) {
					newState.byMeterID[meterID][timeInterval][barDuration] = { isFetching: true };
				} else {
					newState.byMeterID[meterID][timeInterval][barDuration] = { ...newState.byMeterID[meterID][timeInterval][barDuration], isFetching: true };
				}
			}

			return newState;
		}
		case ActionType.RequestGroupBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const newState = {
				...state,
				byGroupID: {
					...state.byGroupID
				}
			};

			for (const groupID of action.groupIDs) {
				if (newState.byGroupID[groupID] === undefined) {
					newState.byGroupID[groupID] = {};
				}
				if (newState.byGroupID[groupID][timeInterval] === undefined) {
					newState.byGroupID[groupID][timeInterval] = {};
				} else if (newState.byGroupID[groupID][timeInterval][barDuration] === undefined) {
					newState.byGroupID[groupID][timeInterval][barDuration] = { isFetching: true };
				} else {
					newState.byGroupID[groupID][timeInterval][barDuration] = { ...newState.byGroupID[groupID][timeInterval][barDuration], isFetching: true };
				}
			}

			return newState;
		}
		case ActionType.ReceiveMeterBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				}
			};

			for (const meterID of action.meterIDs) {
				const readingsForMeter = action.readings[meterID];
				newState.byMeterID[meterID][timeInterval][barDuration] = { isFetching: false, readings: readingsForMeter };
			}

			return newState;
		}
		case ActionType.ReceiveGroupBarReadings: {
			const timeInterval = action.timeInterval.toString();
			const barDuration = action.barDuration.toISOString();
			const newState = {
				...state,
				byGroupID: {
					...state.byGroupID
				}
			};

			for (const groupID of action.groupIDs) {
				const readingsForGroup = action.readings[groupID];
				newState.byGroupID[groupID][timeInterval][barDuration] = { isFetching: false, readings: readingsForGroup };
			}
			return newState;
		}
		default:
			return state;
	}
}
