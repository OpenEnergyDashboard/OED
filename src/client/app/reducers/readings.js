import * as readingsActions from '../actions/readings';
import * as metersActions from '../actions/meters';

import { stringifyTimeInterval } from '../util';

/**
 * @typedef {Object} State~Readings
 * @property {Object.<number, Object.<string, State~Readings~ReadingsForTimeInterval>>} byMeterID
 */

/**
 * @type {State~Readings}
 */
export const defaultState = {
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
export function readings(state = defaultState, action) {
	switch (action.type) {
		case readingsActions.RECEIVE_READINGS:
		case readingsActions.REQUEST_READINGS: {
			const timeInterval = stringifyTimeInterval(action.startTimestamp, action.endTimestamp);
			return {
				...state,
				byMeterID: {
					...state.byMeterID,
					[action.meterID]: {
						...state.byMeterID[action.meterID],
						[timeInterval]: readingsForTimeInterval(state.byMeterID[action.meterID][timeInterval], action)
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

		default:
			return state;
	}
}
