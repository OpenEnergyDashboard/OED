/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fetchAllNeededReadings, fetchBarNeededReadings } from './readings';
import TimeInterval from '../../../common/TimeInterval';


export const UPDATE_SELECTED_METERS = 'UPDATE_SELECTED_METERS';
export const UPDATE_BAR_DURATION = 'UPDATE_BAR_DURATION';
export const CHANGE_CHART_TO_RENDER = 'CHANGE_CHART_TO_RENDER';
export const CHANGE_BAR_STACKING = 'CHANGE_BAR_STACKING';
export const SET_GRAPH_ZOOM = 'CHANGE_GRAPH_ZOOM';

/**
 * @param {string} chartType is either 'line' or 'bar'
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
	return (dispatch, state) => {
		dispatch(updateBarDuration(barDuration));
		dispatch(fetchBarNeededReadings(state().graph.timeInterval));
		return Promise.resolve();
	};
}

export function changeSelectedMeters(meterIDs) {
	return (dispatch, state) => {
		dispatch(updateSelectedMeters(meterIDs));
		dispatch(fetchAllNeededReadings(meterIDs, state().graph.timeInterval));
		return Promise.resolve();
	};
}

function fetchNeededReadingsForGraph(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(fetchAllNeededReadings(meterIDs, timeInterval));
		dispatch(fetchAllNeededReadings(meterIDs, TimeInterval.unbounded()));
	};
}

function setGraphZoom(timeInterval) {
	return { type: SET_GRAPH_ZOOM, timeInterval };
}

function shouldChangeGraphZoom(state, timeInterval) {
	return !state.graph.timeInterval.equals(timeInterval);
}

export function changeGraphZoomIfNeeded(timeInterval) {
	return (dispatch, getState) => {
		if (shouldChangeGraphZoom(getState())) {
			dispatch(setGraphZoom(timeInterval));
			dispatch(fetchNeededReadingsForGraph(getState().graph.selectedMeters, timeInterval));
		}
	};
}
