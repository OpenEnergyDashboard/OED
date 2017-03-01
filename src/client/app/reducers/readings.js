
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as readingsActions from '../actions/readings';
import * as metersActions from '../actions/meters';

/**
 * @typedef {Object} State~Readings
 * @property {Object.<number, Object.<string, State~Readings~ReadingsForTimeInterval>>} byMeterID
 */

/**
 * @type {State~Readings}
 */
const defaultState = {
	byMeterID: {}
};

/**
 * @typedef {Object} State~Readings~ReadingsForTimeInterval
 * @property {boolean} isFetching
 * @property {?Array} readings
 */

/**
 * @param {State~Readings~ReadingsForTimeInterval} state
 * @param action
 */
function readingsForTimeInterval(state = {}, action) {
	switch (action.type) {
		case readingsActions.REQUEST_READINGS:
			return { ...state, isFetching: true };
		case readingsActions.RECEIVE_READINGS:
			return { isFetching: false, readings: action.readings };
		default:
			return state;
	}
}

/**
 * @param {State~Readings} state
 * @param action
 * @return {State~Readings}
 */
export default function readings(state = defaultState, action) {
	switch (action.type) {
		case readingsActions.RECEIVE_READINGS:
		case readingsActions.REQUEST_READINGS: {
			return {
				...state,
				byMeterID: {
					...state.byMeterID,
					[action.meterID]: {
						...state.byMeterID[action.meterID],
						[action.timeInterval]: readingsForTimeInterval(state.byMeterID[action.meterID][action.timeInterval], action)
					}
				}
			};
		}
		case metersActions.RECEIVE_METERS_DATA: {
			const newEmptyReadingsByMeterID = {};
			for (const { id } of action.data) {
				newEmptyReadingsByMeterID[id] = {};
			}
			return {
				...state,
				byMeterID: {
					...newEmptyReadingsByMeterID,
					...state.byMeterID
				}
			};
		}
		case readingsActions.REQUEST_MANY_READINGS: {
			const timeInterval = action.timeInterval;
			const newState = {
				...state,
				byMeterID: {
					...state.byMeterID
				}
			};
			for (const meterID of action.meterIDs) {
				newState.byMeterID[meterID][timeInterval] = { ...newState.byMeterID[meterID][timeInterval], isFetching: true };
			}
			return newState;
		}
		case readingsActions.RECEIVE_MANY_READINGS: {
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
