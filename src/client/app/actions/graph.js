/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fetchNeededReadings } from './readings';
import TimeInterval from '../../../common/TimeInterval';


export const SELECT_METER = 'SELECT_METER';
export const UNSELECT_METER = 'UNSELECT_METER';
export const UPDATE_SELECTED_METERS = 'UPDATE_SELECTED_METERS';
export const SET_GRAPH_ZOOM = 'CHANGE_GRAPH_ZOOM';


export function selectMeter(meterID) {
	return { type: SELECT_METER, meterID };
}

export function unselectMeter(meterID) {
	return { type: UNSELECT_METER, meterID };
}

export function updateSelectedMeters(meterIDs) {
	return { type: UPDATE_SELECTED_METERS, meterIDs };
}

export function changeSelectedMeters(meterIDs) {
	return (dispatch, state) => {
		dispatch(updateSelectedMeters(meterIDs));
		dispatch(fetchNeededReadings(meterIDs, state().graph.timeInterval));
		return Promise.resolve();
	};
}

function fetchNeededReadingsForGraph(meterIDs, timeInterval) {
	return dispatch => {
		dispatch(fetchNeededReadings(meterIDs, timeInterval));
		dispatch(fetchNeededReadings(meterIDs, TimeInterval.unbounded()));
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
