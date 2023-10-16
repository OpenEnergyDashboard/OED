/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { GraphAction, GraphState, ChartTypes } from '../types/redux/graph';
import { ActionType } from '../types/redux/actions';
import { calculateCompareTimeInterval, ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import { AreaUnitType } from '../utils/getAreaUnitConversion';

const defaultState: GraphState = {
	selectedMeters: [],
	selectedGroups: [],
	selectedUnit: -99,
	selectedAreaUnit: AreaUnitType.none,
	timeInterval: TimeInterval.unbounded(),
	rangeSliderInterval: TimeInterval.unbounded(),
	barDuration: moment.duration(4, 'weeks'),
	comparePeriod: ComparePeriod.Week,
	compareTimeInterval: calculateCompareTimeInterval(ComparePeriod.Week, moment()),
	compareSortingOrder: SortingOrder.Descending,
	chartToRender: ChartTypes.line,
	barStacking: false,
	areaNormalization: false,
	hotlinked: false,
	optionsVisibility: true,
	lineGraphRate: { label: 'hour', rate: 1 },
	renderOnce: false,
	showMinMax: false
};

export default function graph(state = defaultState, action: GraphAction) {
	switch (action.type) {
		case ActionType.ConfirmGraphRenderOnce: {
			return {
				...state,
				renderOnce: true
			};
		}
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
		case ActionType.UpdateSelectedAreaUnit:
			return {
				...state,
				selectedAreaUnit: action.areaUnit
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
		case ActionType.ToggleAreaNormalization:
			return {
				...state,
				areaNormalization: !state.areaNormalization
			};
		case ActionType.ToggleShowMinMax:
			return {
				...state,
				showMinMax: !state.showMinMax
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
		case ActionType.ToggleOptionsVisibility:
			return {
				...state,
				optionsVisibility: !state.optionsVisibility
			};
		case ActionType.UpdateLineGraphRate:
			return {
				...state,
				lineGraphRate: action.lineGraphRate
			};
		default:
			return state;
	}
}
