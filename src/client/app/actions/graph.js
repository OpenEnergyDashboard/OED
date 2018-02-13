/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fetchNeededLineReadings } from './lineReadings';
import { fetchNeededBarReadings, fetchNeededCompareReadings } from './barReadings';
import { fetchMetersDetailsIfNeeded } from './meters';
import { fetchGroupsDetailsIfNeeded } from './groups';

export const UPDATE_SELECTED_METERS = 'UPDATE_SELECTED_METERS';
export const UPDATE_SELECTED_GROUPS = 'UPDATE_SELECTED_GROUPS';
export const UPDATE_BAR_DURATION = 'UPDATE_BAR_DURATION';
export const CHANGE_CHART_TO_RENDER = 'CHANGE_CHART_TO_RENDER';
export const CHANGE_BAR_STACKING = 'CHANGE_BAR_STACKING';
export const CHANGE_GRAPH_ZOOM = 'CHANGE_GRAPH_ZOOM';
export const UPDATE_COMPARE_INTERVAL = 'UPDATE_COMPARE_INTERVAL';
export const UPDATE_COMPARE_DURATION = 'UPDATE_COMPARE_DURATION';
export const TOGGLE_HOTLINKED = 'TOGGLE_HOTLINKED';


function toggleHotlinked() {
	return { type: 'TOGGLE_HOTLINKED' };
}

/**
 * @param {string} chartType is one of chartTypes
 * @returns {*} An action needed to change the chart type
 */
export function changeChartToRender(chartType) {
	return { type: CHANGE_CHART_TO_RENDER, chartType };
}

export function changeBarStacking() {
	return { type: CHANGE_BAR_STACKING };
}

function updateSelectedMeters(meterIDs) {
	return { type: UPDATE_SELECTED_METERS, meterIDs };
}

function updateSelectedGroups(groupIDs) {
	return { type: UPDATE_SELECTED_GROUPS, groupIDs };
}

function updateBarDuration(barDuration) {
	return { type: UPDATE_BAR_DURATION, barDuration };
}

export function changeBarDuration(barDuration) {
	return (dispatch, getState) => {
		dispatch(updateBarDuration(barDuration));
		dispatch(fetchNeededBarReadings(getState().graph.timeInterval));
		return Promise.resolve();
	};
}

function updateCompareTimeInterval(compareTimeInterval) {
	return { type: UPDATE_COMPARE_INTERVAL, compareTimeInterval };
}

function updateCompareDuration(compareDuration) {
	return { type: UPDATE_COMPARE_DURATION, compareDuration };
}

export function changeCompareTimeInterval(compareTimeInterval, compareDuration) {
	return (dispatch, getState) => {
		dispatch(updateCompareTimeInterval(compareTimeInterval));
		dispatch(updateCompareDuration(compareDuration));
		dispatch(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
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
			dispatch2(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
		});
		return Promise.resolve();
	};
}

export function changeSelectedGroups(groupIDs) {
	return (dispatch, getState) => {
		dispatch(updateSelectedGroups(groupIDs));
		// Nesting dispatches to preserve that updateSelectedGroups() is called before fetching readings
		dispatch(dispatch2 => {
			dispatch2(fetchNeededLineReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededBarReadings(getState().graph.timeInterval));
			dispatch2(fetchNeededCompareReadings(getState().graph.compareTimeInterval));
		});
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

/**
 * Update graph options from a link
 * @param options - Object of possible values to dispatch with keys: meterIDs, groupIDs, chartType, barDuration, toggleBarStacking
 * @returns {function(*)}
 */
export function changeOptionsFromLink(options) {
	const dispatchFirst = [toggleHotlinked()];
	const dispatchSecond = [];
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
	if (options.changeBarStacking) {
		dispatchSecond.push(changeBarStacking());
	}
	return dispatch => Promise.all(dispatchFirst.map(dispatch))
			.then(() => Promise.all(dispatchSecond.map(dispatch)));
}
