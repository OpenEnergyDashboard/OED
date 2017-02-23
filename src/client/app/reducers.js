/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import * as actionModule from './actions';

function graph(state = {}, action) {
	switch (action.type) {
		case actionModule.CHANGE_DEFAULT_METER_TO_DISPLAY:
			return Object.assign({}, state, {
				defaultMeterToDisplay: action.meterID
			});
		case actionModule.REQUEST_GRAPH_DATA:
			return _.merge(state, { data: { [action.meterID]: { isFetching: true, readings: [] } } });
		case actionModule.RECEIVE_GRAPH_DATA:
			return _.merge(state, { data: { [action.meterID]: { isFetching: false, readings: action.data } } });
		default:
			return state;
	}
}

function meters(state = {}, action) {
	switch (action.type) {
		case actionModule.REQUEST_METER_DATA:
			return Object.assign({}, state, {
				isFetching: true
			});
		case actionModule.RECEIVE_METER_DATA:
			return Object.assign({}, state, {
				isFetching: false,
				data: action.data
			});
		case actionModule.CHANGE_SELECTED_METERS:
			return Object.assign({}, state, {
				selected: action.selectedMeters
			});
		default:
			return state;
	}
}

const defaultState = {
	graph: {
		defaultMeterToDisplay: 6,
		data: {}
	},
	meters: {
		isFetching: false,
	}
};

function rootReducer(state = defaultState, action) {
	switch (action.type) {
		case actionModule.CHANGE_DEFAULT_METER_TO_DISPLAY:
		case actionModule.REQUEST_GRAPH_DATA:
		case actionModule.RECEIVE_GRAPH_DATA:
			return Object.assign({}, state, {
				graph: graph(state.graph, action)
			});
		case actionModule.REQUEST_METER_DATA:
		case actionModule.RECEIVE_METER_DATA:
		case actionModule.CHANGE_SELECTED_METERS:
			return Object.assign({}, state, {
				meters: meters(state.meters, action)
			});
		default:
			return state;
	}
}

export default rootReducer;
