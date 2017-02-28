/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fetchNeededReadings } from './readings';

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

export function changeSelectedMeters(meterIDs) {
	return { type: CHANGE_SELECTED_METERS, meterIDs };
}

export function setGraphZoom(timeInterval) {
	return { type: SET_GRAPH_ZOOM, timeInterval };
}

function changeGraphZoom(timeInterval) {
	return (dispatch, getState) => {
		const state = getState();
		dispatch(setGraphZoom(timeInterval));
		dispatch(fetchNeededReadings(state.graph.selectedMeters, timeInterval));
	};
}
