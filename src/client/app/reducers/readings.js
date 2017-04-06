
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as readingsActions from '../actions/readings';

/**
 * @typedef {Object} State~Readings
 * @property {Object.<number, Object.<string, State~Readings~ReadingsForTimeInterval>>} byMeterID
 */

/**
 * @type {State~Readings}
 */
const defaultState = {
	line: {
		byMeterID: {}
	},
	bar: {
		byMeterID: {}
	}
};

/**
 * @param {State~Readings} state
 * @param action
 * @return {State~Readings}
 */
export default function readings(state = defaultState, action) {
	switch (action.type) {
		case readingsActions.REQUEST_MANY_READINGS: {
			const timeInterval = action.timeInterval;
			const newState = {
				...state,
				line: {
					byMeterID: {
						...state.line.byMeterID
					}
				}
			};
			for (const meterID of action.meterIDs) {
				if (newState.line.byMeterID[meterID] === undefined) {
					newState.line.byMeterID[meterID] = {};
				} else if (newState.line.byMeterID[meterID][timeInterval] === undefined) {
					newState.line.byMeterID[meterID][timeInterval] = { isFetching: true };
				} else {
					newState.line.byMeterID[meterID][timeInterval] = { ...newState.line.byMeterID[meterID][timeInterval], isFetching: true };
				}
			}
			return newState;
		}
		case readingsActions.RECEIVE_MANY_READINGS: {
			const timeInterval = action.timeInterval;
			const newState = {
				...state,
				line: {
					byMeterID: {
						...state.line.byMeterID
					}
				}
			};
			for (const meterID of action.meterIDs) {
				const readingsForMeter = action.readings[meterID];
				newState.line.byMeterID[meterID][timeInterval] = { isFetching: false, readings: readingsForMeter };
			}
			return newState;
		}
		default:
			return state;
	}
}
