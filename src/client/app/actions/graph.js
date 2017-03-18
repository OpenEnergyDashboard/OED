/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { fetchReadingsIfNeeded } from './readings';

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
	return (dispatch, getState) => {
		dispatch(updateSelectedMeters(meterIDs));
		for (const meterID of meterIDs) {
			dispatch(fetchReadingsIfNeeded(meterID, getState().graph.startTimestamp, getState().graph.endTimestamp));
		}
		return Promise.resolve();
	};
}

export function setGraphZoom(startTimestamp, endTimestamp) {
	return { type: SET_GRAPH_ZOOM, startTimestamp, endTimestamp };
}
