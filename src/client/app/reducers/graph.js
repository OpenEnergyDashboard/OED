/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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
const defaultState = {
	selectedMeters: []
};

/**
 * @param {State~Graph} state
 * @param action
 * @return {State~Graph}
 */
export default function graph(state = defaultState, action) {
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
