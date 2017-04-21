
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as readingsActions from '../actions/lineReadings';

/**
 * @type {State~Readings}
 */
const defaultState = {
	byMeterID: {}
};

/**
 * @param {State~Readings} state
 * @param action
 * @return {State~Readings}
 */
export default function readings(state = defaultState, action) {
	switch (action.type) {
		case readingsActions.REQUEST_LINE_READINGS: {
			const timeInterval = action.timeInterval;
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				}
			};
			for (const meterID of action.meterIDs) {
				if (newState.byMeterID[meterID] === undefined) {
					newState.byMeterID[meterID] = {};
				} else if (newState.byMeterID[meterID][timeInterval] === undefined) {
					newState.byMeterID[meterID][timeInterval] = { isFetching: true };
				} else {
					newState.byMeterID[meterID][timeInterval] = { ...newState.byMeterID[meterID][timeInterval], isFetching: true };
				}
			}
			return newState;
		}
		case readingsActions.RECEIVE_LINE_READINGS: {
			const timeInterval = action.timeInterval;
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
		default:
			return state;
	}
}
