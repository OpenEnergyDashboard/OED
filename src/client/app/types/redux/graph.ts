/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';
import { ComparePeriod, SortingOrder } from '../../utils/calculateCompare';

export enum ChartTypes {
	line = 'line',
	bar = 'bar',
	compare = 'compare',
	map = 'map'
}

// Rates that can be graphed, only relevant to line graphs.
export const LineGraphRates = {
	'second': (1/3600),
	'minute': (1/60),
	'hour': 1,
	'day': 24
}

export interface UpdateSelectedMetersAction {
	type: ActionType.UpdateSelectedMeters;
	meterIDs: number[];
}

export interface UpdateSelectedGroupsAction {
	type: ActionType.UpdateSelectedGroups;
	groupIDs: number[];
}

export interface UpdateSelectedUnitAction {
	type: ActionType.UpdateSelectedUnit;
	unitID: number;
}

export interface UpdateBarDurationAction {
	type: ActionType.UpdateBarDuration;
	barDuration: moment.Duration;
}

export interface ChangeChartToRenderAction {
	type: ActionType.ChangeChartToRender;
	chartType: ChartTypes;
}

export interface ChangeNormalizeByAreaAction {
	type: ActionType.ChangeNormalizeByArea;
}

export interface ChangeBarStackingAction {
	type: ActionType.ChangeBarStacking;
}

export interface ChangeGraphZoomAction {
	type: ActionType.ChangeGraphZoom;
	timeInterval: TimeInterval;
}

export interface ChangeSliderRangeAction {
	type: ActionType.ChangeSliderRange;
	sliderInterval: TimeInterval;
}

export interface ResetRangeSliderStackAction {
	type: ActionType.ResetRangeSliderStack;
}

export interface UpdateComparePeriodAction {
	type: ActionType.UpdateComparePeriod;
	comparePeriod: ComparePeriod;
	currentTime: moment.Moment;
}

export interface ChangeCompareSortingOrderAction {
	type: ActionType.ChangeCompareSortingOrder;
	compareSortingOrder: SortingOrder;
}

export interface SetHotlinked {
	type: ActionType.SetHotlinked;
	hotlinked: boolean;
}

export interface SetOptionsVisibility {
	type: ActionType.SetOptionsVisibility;
	visibility: boolean;
}

export interface UpdateLineGraphRate {
	type: ActionType.UpdateLineGraphRate;
	lineGraphRate: LineGraphRate;
}

export type GraphAction =
	| ChangeGraphZoomAction
	| ChangeSliderRangeAction
	| ResetRangeSliderStackAction
	| ChangeBarStackingAction
	| ChangeNormalizeByAreaAction
	| ChangeChartToRenderAction
	| UpdateBarDurationAction
	| UpdateSelectedGroupsAction
	| UpdateSelectedMetersAction
	| UpdateSelectedUnitAction
	| UpdateComparePeriodAction
	| SetHotlinked
	| ChangeCompareSortingOrderAction
	| SetOptionsVisibility
	| UpdateLineGraphRate;

export interface LineGraphRate {
	label: string,
	rate: number
}

export interface GraphState {
	normalizeByArea: boolean;
	selectedMeters: number[];
	selectedGroups: number[];
	selectedUnit: number;
	timeInterval: TimeInterval;
	rangeSliderInterval: TimeInterval;
	barDuration: moment.Duration;
	comparePeriod: ComparePeriod;
	compareTimeInterval: TimeInterval;
	compareSortingOrder: SortingOrder;
	chartToRender: ChartTypes;
	barStacking: boolean;
	hotlinked: boolean;
	optionsVisibility: boolean;
	lineGraphRate: LineGraphRate;
}
