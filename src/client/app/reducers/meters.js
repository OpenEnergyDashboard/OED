import _ from 'lodash';
import * as metersActions from '../actions/meters';

/**
 * @typedef {Object} State~Meters
 * @property {boolean} isFetching
 * @property {Object<number, Object>} byMeterID
 */

export const defaultState = {
	isFetching: false,
	byMeterID: {}
};

/**
 * @param {State~Meters} state
 * @param action
 * @return {State~Meters}
 */
export function meters(state = defaultState, action) {
	switch (action.type) {
		case metersActions.REQUEST_METERS_DATA:
			return {
				...state,
				isFetching: true
			};
		case metersActions.RECEIVE_METERS_DATA:
			return {
				...state,
				isFetching: false,
				byMeterID: _.keyBy(action.data, meter => meter.id)
			};
		default:
			return state;
	}
}
