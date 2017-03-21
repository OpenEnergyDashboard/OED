/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SELECT_METER = 'SELECT_METER';
export const SELECT_GROUP = 'SELECT_GROUP';
export const UNSELECT_METER = 'UNSELECT_METER';
export const UNSELECT_GROUP = 'UNSELECT_GROUP';
export const CHANGE_SELECTED_METERS = 'CHANGE_SELECTED_METERS';
export const CHANGE_SELECTED_GROUPS = 'CHANGE_SELECTED_GROUPS';
export const SET_GRAPH_ZOOM = 'CHANGE_GRAPH_ZOOM';


export function selectMeter(meterID) {
	return { type: SELECT_METER, meterID };
}

export function selectGroupss(groupID) {
	return { type: SELECT_GROUP, groupID };
}

export function unselectMeter(meterID) {
	return { type: UNSELECT_METER, meterID };
}

export function unselectGroup(groupID) {
	return { type: UNSELECT_GROUP, groupID };
}

export function changeSelectedMeters(meterIDs) {
	return { type: CHANGE_SELECTED_METERS, meterIDs };
}

export function changeSelectedGroups(groupIDs) {
	return { type: CHANGE_SELECTED_GROUPS, groupIDs };
}

export function setGraphZoom(startTimestamp, endTimestamp) {
	return { type: SET_GRAPH_ZOOM, startTimestamp, endTimestamp };
}
