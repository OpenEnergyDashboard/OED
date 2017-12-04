/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import * as graphActions from '../actions/graph';
import { ActionType } from '../types/redux';

export enum chartTypes {
	line = 'line',
	bar = 'bar',
	compare = 'compare'
}

/**
 * @type {State~Graph}
 */
export interface GraphState {
	selectedMeters: number[];
	selectedGroups: number[];
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
	compareTimeInterval: TimeInterval;
	compareDuration: moment.Duration;
	chartToRender: chartTypes;
	barStacking: boolean;
}

const defaultState: GraphState = {
	selectedMeters: [],
	selectedGroups: [],
	timeInterval: TimeInterval.unbounded(),
	barDuration: moment.duration(1, 'month'),
	compareTimeInterval: new TimeInterval(moment().startOf('week'), moment()),
	compareDuration: moment.duration(1, 'days'),
	chartToRender: chartTypes.line,
	barStacking: false
};

/**
 * @param {State~Graph} state
 * @param action
 * @return {State~Graph}
 */
export default function graph(state = defaultState, action: graphActions.GraphAction) {
	switch (action.type) {
		case ActionType.UpdateSelectedMeters:
			return {
				...state,
				selectedMeters: action.meterIDs
			};
		case ActionType.UpdateSelectedGroups:
			return {
				...state,
				selectedGroups: action.groupIDs
			};
		case ActionType.UpdateBarDuration:
			return {
				...state,
				barDuration: action.barDuration
			};
		case ActionType.ChangeGraphZoom:
			return {
				...state,
				timeInterval: action.timeInterval
			};
		case ActionType.ChangeChartToRender:
			return {
				...state,
				chartToRender: action.chartType
			};
		case ActionType.ChangeBarStacking:
			return {
				...state,
				barStacking: !state.barStacking
			};
		default:
			return state;
	}
}
