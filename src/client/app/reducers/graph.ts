/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { GraphAction, GraphState, ChartTypes } from '../types/redux/graph';
import { ActionType } from '../types/redux/actions';
import { calculateCompareTimeInterval, ComparePeriod, SortingOrder } from '../utils/calculateCompare';

const defaultState: GraphState = {
	selectedMeters: [],
	selectedGroups: [],
	selectedUnit: -99,
	timeInterval: TimeInterval.unbounded(),
	rangeSliderInterval: TimeInterval.unbounded(),
	barDuration: moment.duration(4, 'weeks'),
	comparePeriod: ComparePeriod.Week,
	compareTimeInterval: calculateCompareTimeInterval(ComparePeriod.Week, moment()),
	compareSortingOrder: SortingOrder.Descending,
	chartToRender: ChartTypes.line,
	barStacking: false,
	hotlinked: false,
	optionsVisibility: true
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
		case ActionType.UpdateSelectedUnit:
			return {
				...state,
				selectedUnit: action.unitID
			}
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
		case ActionType.ChangeSliderRange:
			return {
				...state,
				rangeSliderInterval: action.sliderInterval
			};
		case ActionType.ResetRangeSliderStack:
			return {
				...state,
				rangeSliderInterval: TimeInterval.unbounded()
			};
		case ActionType.UpdateComparePeriod:
			return {
				...state,
				comparePeriod: action.comparePeriod,
				compareTimeInterval: calculateCompareTimeInterval(action.comparePeriod, action.currentTime)
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
		case ActionType.ChangeCompareSortingOrder:
			return {
				...state,
				compareSortingOrder: action.compareSortingOrder
			};
		case ActionType.SetOptionsVisibility:
			return {
				...state,
				optionsVisibility: action.visibility
			};
		default:
			return state;
	}
}
