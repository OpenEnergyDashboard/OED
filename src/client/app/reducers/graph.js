/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import moment from 'moment';
import TimeInterval from '../../../common/TimeInterval';
import * as graphActions from '../actions/graph';

export const chartTypes = {
	line: 'line',
	bar: 'bar',
	compare: 'compare'
};

/**
 * @type {State~Graph}
 */
const defaultState = {
	selectedMeters: [],
	selectedGroups: [],
	timeInterval: TimeInterval.unbounded(),
	barDuration: moment.duration(28, 'days'),
	compareTimeInterval: new TimeInterval(moment().startOf('week').subtract(7, 'days'), moment()).toString(),
	compareDuration: moment.duration(1, 'days'),
	chartToRender: chartTypes.line,
	barStacking: false,
	hotlinked: false
};

/**
 * @param {State~Graph} state
 * @param action
 * @return {State~Graph}
 */
export default function graph(state = defaultState, action) {
	switch (action.type) {
		case graphActions.TOGGLE_HOTLINKED:
			return {
				...state,
				hotlinked: !state.hotlinked
			};
		case graphActions.UPDATE_SELECTED_METERS:
			return {
				...state,
				selectedMeters: action.meterIDs
			};
		case graphActions.UPDATE_SELECTED_GROUPS:
			return {
				...state,
				selectedGroups: action.groupIDs
			};
		case graphActions.UPDATE_BAR_DURATION:
			return {
				...state,
				barDuration: action.barDuration
			};
		case graphActions.UPDATE_COMPARE_INTERVAL:
			return {
				...state,
				compareTimeInterval: action.compareTimeInterval
			};
		case graphActions.UPDATE_COMPARE_DURATION:
			return {
				...state,
				compareDuration: action.compareDuration
			};
		case graphActions.CHANGE_GRAPH_ZOOM:
			return {
				...state,
				timeInterval: action.timeInterval
			};
		case graphActions.CHANGE_CHART_TO_RENDER:
			return {
				...state,
				chartToRender: action.chartType
			};
		case graphActions.CHANGE_BAR_STACKING:
			return {
				...state,
				barStacking: !state.barStacking
			};
		default:
			return state;
	}
}
