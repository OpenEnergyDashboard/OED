/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fetchNeededReadings } from './readings';
import TimeInterval from '../../../common/TimeInterval';

export const SELECT_METER = 'SELECT_METER';
export const UNSELECT_METER = 'UNSELECT_METER';
export const CHANGE_SELECTED_METERS = 'CHANGE_SELECTED_METERS';
export const SET_GRAPH_ZOOM = 'CHANGE_GRAPH_ZOOM';


export function selectMeter(meterID) {
	return { type: SELECT_METER, meterID };
}

export function unselectMeter(meterID) {
	return { type: UNSELECT_METER, meterID };
}

function fetchNeededReadingsForGraph(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(fetchNeededReadings(meterIDs, timeInterval));
		dispatch(fetchNeededReadings(meterIDs, TimeInterval.unbounded()));
	};
}

export function changeSelectedMeters(meterIDs) {
	return (dispatch, getState) => {
		// TODO: Factor this out into a function
		dispatch({ type: CHANGE_SELECTED_METERS, meterIDs });
		const state = getState();
		dispatch(fetchNeededReadingsForGraph(state.graph.selectedMeters, state.graph.timeInterval));
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
