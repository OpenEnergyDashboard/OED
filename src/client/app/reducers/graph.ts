/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { GraphAction, GraphState, ChartTypes } from '../types/redux/graph';
import { ActionType } from '../types/redux/actions';

const defaultState: GraphState = {
	selectedMeters: [],
	selectedGroups: [],
	timeInterval: TimeInterval.unbounded(),
	barDuration: moment.duration(1, 'month'),
	comparePeriod: 'week',
	chartToRender: ChartTypes.line,
	barStacking: false,
	hotlinked: false
};

export default function graph(state = defaultState, action: GraphAction) {
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
		case ActionType.ChangeComparePeriod:
			return {
				...state,
				comparePeriod: action.comparePeriod
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
		case ActionType.SetHotlinked:
			return {
				...state,
				hotlinked: action.hotlinked
			};
		default:
			return state;
	}
}
