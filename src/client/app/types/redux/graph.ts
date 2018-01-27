/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ActionType } from './actions';

export enum ChartTypes {
	line = 'line',
	bar = 'bar',
	compare = 'compare'
}

export interface UpdateSelectedMetersAction {
	type: ActionType.UpdateSelectedMeters;
	meterIDs: number[];
}

export interface UpdateSelectedGroupsAction {
	type: ActionType.UpdateSelectedGroups;
	groupIDs: number[];
}

export interface UpdateBarDurationAction {
	type: ActionType.UpdateBarDuration;
	barDuration: moment.Duration;
}

export interface ChangeChartToRenderAction {
	type: ActionType.ChangeChartToRender;
	chartType: ChartTypes;
}

export interface ChangeBarStackingAction {
	type: ActionType.ChangeBarStacking;
}

export interface ChangeGraphZoomAction {
	type: ActionType.ChangeGraphZoom;
	timeInterval: TimeInterval;
}

export interface UpdateCompareIntervalAction {
	type: ActionType.UpdateCompareInterval;
	compareTimeInterval: TimeInterval;
}

export interface UpdateCompareDurationAction {
	type: ActionType.UpdateCompareDuration;
	compareDuration: moment.Duration;
}

export type GraphAction =
	| ChangeGraphZoomAction
	| ChangeBarStackingAction
	| ChangeChartToRenderAction
	| UpdateBarDurationAction
	| UpdateSelectedGroupsAction
	| UpdateSelectedMetersAction
	| UpdateCompareIntervalAction
	| UpdateCompareDurationAction;

export interface GraphState {
	selectedMeters: number[];
	selectedGroups: number[];
	timeInterval: TimeInterval;
	barDuration: moment.Duration;
	compareTimeInterval: TimeInterval;
	compareDuration: moment.Duration;
	chartToRender: ChartTypes;
	barStacking: boolean;
}
