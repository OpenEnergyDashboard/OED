/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fetchNeededLineReadings } from './lineReadings';
import { fetchNeededBarReadings } from './barReadings';

export const UPDATE_SELECTED_METERS = 'UPDATE_SELECTED_METERS';
export const UPDATE_BAR_DURATION = 'UPDATE_BAR_DURATION';
export const CHANGE_CHART_TO_RENDER = 'CHANGE_CHART_TO_RENDER';
export const CHANGE_BAR_STACKING = 'CHANGE_BAR_STACKING';
export const CHANGE_GRAPH_ZOOM = 'CHANGE_GRAPH_ZOOM';

/**
 * @param {string} chartType is either chartTypes.line or chartTypes.bar
 * @returns {*} An action needed to change the chart type
 */
export function changeChartToRender(chartType) {
	return { type: CHANGE_CHART_TO_RENDER, chartType };
}

export function changeBarStacking() {
	return { type: CHANGE_BAR_STACKING };
}

export function updateSelectedMeters(meterIDs) {
	return { type: UPDATE_SELECTED_METERS, meterIDs };
}

export function updateBarDuration(barDuration) {
	return { type: UPDATE_BAR_DURATION, barDuration };
}

export function changeBarDuration(barDuration) {
	return (dispatch, getState) => {
		dispatch(updateBarDuration(barDuration));
		dispatch(fetchNeededBarReadings(getState().graph.timeInterval));
		return Promise.resolve();
	};
}

export function changeSelectedMeters(meterIDs) {
	return (dispatch, getState) => {
		dispatch(updateSelectedMeters(meterIDs));
		// Nesting dispatches to preserve that updateSelectedMeters() is called before fetching readings
		dispatch(dispatch2 => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval));
		});
		return Promise.resolve();
	};
}
export function changeSelectedBuilding(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(updateSelectedMeters(meterIDs));
		dispatch(fetchNeededLineReadings(timeInterval, 1300));
		return Promise.resolve();
	};
}

function fetchNeededReadingsForGraph(timeInterval) {
	return dispatch => {
		dispatch(fetchNeededLineReadings(timeInterval));
		dispatch(fetchNeededBarReadings(timeInterval));
	};
}

function changeGraphZoom(timeInterval) {
	return { type: CHANGE_GRAPH_ZOOM, timeInterval };
}

function shouldChangeGraphZoom(state, timeInterval) {
	return !state.graph.timeInterval.equals(timeInterval);
}

export function changeGraphZoomIfNeeded(timeInterval) {
	return (dispatch, getState) => {
		if (shouldChangeGraphZoom(getState())) {
			dispatch(changeGraphZoom(timeInterval));
			dispatch(fetchNeededReadingsForGraph(timeInterval));
		}
	};
}
