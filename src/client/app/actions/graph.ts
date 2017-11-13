/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as moment from 'moment';
import { fetchNeededLineReadings } from './lineReadings';
import { fetchNeededBarReadings, fetchNeededCompareReadings } from './barReadings';
import { TimeInterval } from '../../../common/TimeInterval';
import { chartTypes } from '../reducers/graph';

export const UPDATE_SELECTED_METERS = 'UPDATE_SELECTED_METERS';
export const UPDATE_SELECTED_GROUPS = 'UPDATE_SELECTED_GROUPS';
export const UPDATE_BAR_DURATION = 'UPDATE_BAR_DURATION';
export const CHANGE_CHART_TO_RENDER = 'CHANGE_CHART_TO_RENDER';
export const CHANGE_BAR_STACKING = 'CHANGE_BAR_STACKING';
export const CHANGE_GRAPH_ZOOM = 'CHANGE_GRAPH_ZOOM';

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
}

/**
 * @param {string} chartType is one of chartTypes
 * @returns {*} An action needed to change the chart type
 */
export function changeChartToRender(chartType: chartTypes): ChangeChartToRenderAction {
	return { type: CHANGE_CHART_TO_RENDER, chartType };
}

export function changeBarStacking(): ChangeBarStackingAction {
	return { type: CHANGE_BAR_STACKING };
}

export function updateSelectedMeters(meterIDs: number[]): UpdateSelectedMetersAction {
	return { type: UPDATE_SELECTED_METERS, meterIDs };
}

export function updateSelectedGroups(groupIDs: number[]): UpdateSelectedGroupsAction {
	return { type: UPDATE_SELECTED_GROUPS, groupIDs };
}

export function updateBarDuration(barDuration: number): UpdateBarDurationAction {
	return { type: UPDATE_BAR_DURATION, barDuration };
}

export function changeBarDuration(barDuration: number) {
	return (dispatch, getState) => {
		dispatch(updateBarDuration(barDuration));
		dispatch(fetchNeededBarReadings(getState().graph.timeInterval));
		return Promise.resolve();
	};
}

export function changeSelectedMeters(meterIDs: number[]) {
	return (dispatch, getState) => {
		dispatch(updateSelectedMeters(meterIDs));
		// Nesting dispatches to preserve that updateSelectedMeters() is called before fetching readings
		dispatch(dispatch2 => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
		});
		return Promise.resolve();
	};
}

export function changeSelectedGroups(groupIDs: number[]) {
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

function fetchNeededReadingsForGraph(timeInterval: TimeInterval) {
	return dispatch => {
		dispatch(fetchNeededLineReadings(timeInterval));
		dispatch(fetchNeededBarReadings(timeInterval));
	};
}

function changeGraphZoom(timeInterval: TimeInterval) {
	return { type: CHANGE_GRAPH_ZOOM, timeInterval };
}

function shouldChangeGraphZoom(state, timeInterval: TimeInterval) {
	return !state.graph.timeInterval.equals(timeInterval);
}

export function changeGraphZoomIfNeeded(timeInterval: TimeInterval) {
	return (dispatch, getState) => {
		if (shouldChangeGraphZoom(getState(), TimeInterval.unbounded())) {
			dispatch(changeGraphZoom(timeInterval));
			dispatch(fetchNeededReadingsForGraph(timeInterval));
		}
	};
}
