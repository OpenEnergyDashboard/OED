import _ from 'lodash';
import * as graphActions from '../actions/graph';

/**
 * @typedef {Object} State~Graph
 * @property {Array.<number>} selectedMeters
 * @property {(number|undefined)} startTimestamp
 * @property {(number|undefined)} endTimestamp
 */

/**
 * @type {State~Graph}
 */
export const defaultState = {
	selectedMeters: []
};

/**
 * @param {State~Graph} state
 * @param action
 * @return {State~Graph}
 */
export function graph(state = { selectedMeters: [] }, action) {
	switch (action.type) {
		case graphActions.SELECT_METER:
			return {
				...state,
				selectedMeters: _.union(state.selectedMeters, [action.meterID])
			};
		case graphActions.UNSELECT_METER:
			return {
				...state,
				selectedMeters: state.selectedMeters.filter(meterID => meterID !== action.meterID)
			};
		case graphActions.CHANGE_SELECTED_METERS:
			return {
				...state,
				selectedMeters: action.meterIDs
			};
		default:
			return state;
	}
}
