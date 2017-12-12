/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { fetchMetersDetailsIfNeeded } from './meters';
import { fetchGroupsDetailsIfNeeded } from './groups';
import { fetchNeededLineReadings } from './lineReadings';
import { fetchNeededBarReadings, fetchNeededCompareReadings } from './barReadings';
import { TimeInterval } from '../../../common/TimeInterval';
import { chartTypes } from '../reducers/graph';
import { State, Dispatch, Thunk, TerminalThunk, ActionType } from '../types/redux';

export interface UpdateSelectedMetersAction {
	type: 'UPDATE_SELECTED_METERS';
	meterIDs: number[];
}

export interface UpdateSelectedGroupsAction {
	type: 'UPDATE_SELECTED_GROUPS';
	groupIDs: number[];
}

export interface UpdateBarDurationAction {
	type: 'UPDATE_BAR_DURATION';
	barDuration: number;
}

export interface ChangeChartToRenderAction {
	type: 'CHANGE_CHART_TO_RENDER';
	chartType: chartTypes;
}

export interface ChangeBarStackingAction {
	type: 'CHANGE_BAR_STACKING';
}

export interface ChangeGraphZoomAction {
	type: 'CHANGE_GRAPH_ZOOM';
	timeInterval: TimeInterval;
}

export type GraphAction =
	| ChangeGraphZoomAction
	| ChangeBarStackingAction
	| ChangeChartToRenderAction
	| UpdateBarDurationAction
	| UpdateSelectedGroupsAction
	| UpdateSelectedMetersAction;


/**
 * @param {string} chartType is one of chartTypes
 * @returns {*} An action needed to change the chart type
 */
export function changeChartToRender(chartType: chartTypes): ChangeChartToRenderAction {
	return { type: ActionType.ChangeChartToRender, chartType };
}

export function changeBarStacking(): ChangeBarStackingAction {
	return { type: ActionType.ChangeBarStacking };
}

export function updateSelectedMeters(meterIDs: number[]): UpdateSelectedMetersAction {
	return { type: ActionType.UpdateSelectedMeters, meterIDs };
}

export function updateSelectedGroups(groupIDs: number[]): UpdateSelectedGroupsAction {
	return { type: ActionType.UpdateSelectedGroups, groupIDs };
}

export function updateBarDuration(barDuration: number): UpdateBarDurationAction {
	return { type: ActionType.UpdateBarDuration, barDuration };
}

function changeGraphZoom(timeInterval: TimeInterval): ChangeGraphZoomAction {
	return { type: ActionType.ChangeGraphZoom, timeInterval };
}

export function changeBarDuration(barDuration: number): Thunk {
	return (dispatch, getState) => {
		dispatch(updateBarDuration(barDuration));
		dispatch(fetchNeededBarReadings(getState().graph.timeInterval));
		return Promise.resolve();
	};
}

export function changeSelectedMeters(meterIDs: number[]): Thunk {
	return (dispatch, getState) => {
		dispatch(updateSelectedMeters(meterIDs));
		// Nesting dispatches to preserve that updateSelectedMeters() is called before fetching readings
		dispatch(dispatch2 => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval));
			// TODO TYPESCRIPT: This is a conflict that isn't resolvable as is. state.graph.compareTimeInterval really should be a TimeInterval.
			dispatch2(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
		});
		return Promise.resolve();
	};
}

export function changeSelectedGroups(groupIDs: number[]): Thunk {
	return (dispatch, getState) => {
		dispatch(updateSelectedGroups(groupIDs));
		// Nesting dispatches to preserve that updateSelectedGroups() is called before fetching readings
		dispatch(dispatch2 => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval));
		});
		return Promise.resolve();
	};
}

function fetchNeededReadingsForGraph(timeInterval: TimeInterval): TerminalThunk {
	return dispatch => {
		dispatch(fetchNeededLineReadings(timeInterval));
		dispatch(fetchNeededBarReadings(timeInterval));
	};
}

function shouldChangeGraphZoom(state: State, timeInterval: TimeInterval): boolean {
	return !state.graph.timeInterval.equals(timeInterval);
}

export function changeGraphZoomIfNeeded(timeInterval: TimeInterval): TerminalThunk {
	return (dispatch, getState) => {
		if (shouldChangeGraphZoom(getState(), TimeInterval.unbounded())) {
			dispatch(changeGraphZoom(timeInterval));
			dispatch(fetchNeededReadingsForGraph(timeInterval));
		}
	};
}

export interface LinkOptions {
	meterIDs?: number[];
	groupIDs?: number[];
	chartType?: chartTypes;
	barDuration?: number;
	toggleBarStacking?: boolean;
}

/**
 * Update graph options from a link
 * @param options - Object of possible values to dispatch with keys: meterIDs, groupIDs, chartType, barDuration, toggleBarStacking
 * @returns {function(*)}
 */
export function changeOptionsFromLink(options: LinkOptions) {
	const dispatchFirst: Thunk[] = [];
	const dispatchSecond: Array<Thunk | ChangeChartToRenderAction | ChangeBarStackingAction> = [];
	if (options.meterIDs) {
		dispatchFirst.push(fetchMetersDetailsIfNeeded());
		dispatchSecond.push(changeSelectedMeters(options.meterIDs));
	}
	if (options.groupIDs) {
		dispatchFirst.push(fetchGroupsDetailsIfNeeded());
		dispatchSecond.push(changeSelectedGroups(options.groupIDs));
	}
	if (options.chartType) {
		dispatchSecond.push(changeChartToRender(options.chartType));
	}
	if (options.barDuration) {
		dispatchSecond.push(changeBarDuration(options.barDuration));
	}
	if (options.toggleBarStacking) {
		dispatchSecond.push(changeBarStacking());
	}
	return (dispatch: Dispatch) => Promise.all(dispatchFirst.map(dispatch))
			.then(() => Promise.all(dispatchSecond.map(dispatch)));
}
