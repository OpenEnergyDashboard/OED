/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';
import _ from 'lodash';

export const REQUEST_GROUPS_DETAILS = 'REQUEST_GROUPS_DETAILS';
export const RECEIVE_GROUPS_DETAILS = 'RECEIVE_GROUPS_DETAILS';

export const REQUEST_GROUP_CHILDREN = 'REQUEST_GROUP_CHILDREN';
export const RECEIVE_GROUP_CHILDREN = 'RECEIVE_GROUP_CHILDREN';

export const GROUPSUI_CHANGE_SELECTED_GROUPS_PER_GROUP = 'GROUPSUI_CHANGE_SELECTED_GROUPS_PER_GROUP';
export const GROUPSUI_CHANGE_SELECTED_METERS_PER_GROUP = 'GROUPSUI_CHANGE_SELECTED_METERS_PER_GROUP';
export const GROUPSUI_CHANGE_DISPLAYED_GROUPS = 'GROUPSUI_CHANGE_DISPLAYED_GROUPS';

export const CREATE_NEW_GROUP = 'CREATE_NEW_GROUP';
export const EDIT_GROUP_NAME = 'EDIT_GROUP_NAME';

export const CHANGE_CHILD_METERS = 'CHANGE_CHILD_METERS';
export const CHANGE_CHILD_GROUPS = 'CHANGE_CHILD_GROUPS';

export const GROUPSUI_CHANGE_DISPLAY_MODE = 'GROUPSUI_CHANGE_DISPLAY_MODE';

export const SUBMIT_GROUP_IN_EDITING = 'SUBMIT_GROUP_IN_EDITING';

function requestGroupsDetails() {
	return { type: REQUEST_GROUPS_DETAILS };
}

function receiveGroupsDetails(data) {
	return { type: RECEIVE_GROUPS_DETAILS, data };
}

function fetchGroupsDetails() {
	return dispatch => {
		dispatch(requestGroupsDetails());
		// Returns the names and IDs of all groups in the groups table.
		return axios.get('/api/groups/')
			.then(response => {
				dispatch(receiveGroupsDetails(response.data));
			});
	};
}


/**
 * @param {State} state
 */
function shouldFetchGroupsDetails(state) {
	return !state.groups.isFetching && _.isEmpty(state.groups.byGroupID);
}

/**
 * @returns {function(*, *)}
 */
export function fetchGroupsDetailsIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchGroupsDetails(getState())) {
			return dispatch(fetchGroupsDetails());
		}
		return Promise.resolve();
	};
}

function requestGroupChildren(groupID) {
	return { type: REQUEST_GROUP_CHILDREN, groupID };
}

function receiveGroupChildren(groupID, data) {
	return { type: RECEIVE_GROUP_CHILDREN, groupID, data };
}

function shouldFetchGroupChildren(state, groupID) {
	const group = state.groups.byGroupID[groupID];
	// Check that the group has no children of any kind AND that it is not being fetched.
	return (group.childGroups.length === 0 && group.childMeters.length === 0) && !group.isFetching;
}

function fetchGroupChildren(groupID) {
	return dispatch => {
		dispatch(requestGroupChildren(groupID));
		return axios.get(`api/groups/children/${groupID}`)
			.then(response => dispatch(receiveGroupChildren(groupID, response.data)));
	};
}
/**
 *
 * @param groupID
 * @returns {function(*, *)}
 */
export function fetchGroupChildrenIfNeeded(groupID) {
	return (dispatch, getState) => {
		if (shouldFetchGroupChildren(getState(), groupID)) {
			return dispatch(fetchGroupChildren(groupID));
		}
		return Promise.resolve();
	};
}

export function changeDisplayedGroups(groupIDs) {
	return { type: GROUPSUI_CHANGE_DISPLAYED_GROUPS, groupIDs };
}

/**
 * Change the selected child groups of a group.
 * This is tracked on a per-group basis. (I.e., each group has its own list of selected child groups.)
 * @param parentID The ID of the group whose subgroups are being selected
 * @param groupIDs The IDs of the new set of selected subgroups
 * @return {{type: string, groupIDs: *}}
 */
export function changeSelectedGroupsOfGroup(parentID, groupIDs) {
	return { type: GROUPSUI_CHANGE_SELECTED_GROUPS_PER_GROUP, parentID, groupIDs };
}

/**
 * Change which child meters of a group are selected.
 * This is tracked on a per-group basis.
 * @param parentID The ID of the group whose subgroups are being selected
 * @param meterIDs The IDs of the new set of selected child meters
 * @return {{type: string, parentID: *, meterIDs: *}}
 */
export function changeSelectedMetersOfGroup(parentID, meterIDs) {
	return { type: GROUPSUI_CHANGE_SELECTED_METERS_PER_GROUP, parentID, meterIDs };
}

/**
 * Set state.groups.groupInEditing to a blank group
 * @return {{type: string}}
 */
export function createNewGroup() {
	return { type: CREATE_NEW_GROUP };
}

/**
 * Change the name of the group in editing
 * @param newName The new name
 * @return {{type: string, newName: String}}
 */
export function editGroupName(newName) {
	return { type: EDIT_GROUP_NAME, newName };
}
/**
 * Change the child groups of the group in editing
 * @param groupIDs IDs of the new child groups
 * @return {{type: string, groupIDs: [Int]}}
 */
export function changeChildGroups(groupIDs) {
	return { type: CHANGE_CHILD_GROUPS, groupIDs };
}

/**
 * Change the child meters of the group in editing
 * @param meterIDs IDs of the new set of child meters
 * @return {{type: string, meterIDs: [Int]}}
 */
export function changeChildMeters(meterIDs) {
	return { type: CHANGE_CHILD_METERS, meterIDs };
}

export function changeDisplayMode(newMode) {
	return { type: GROUPSUI_CHANGE_DISPLAY_MODE, newMode };
}

function submitGroupInEditing() {
	return { type: SUBMIT_GROUP_IN_EDITING };
}

function shouldSubmitGroupInEditing(state) {
	// Should submit if there are uncommitted changes and they have not already been submitted
	return !(state.groups.groupInEditing.free || state.groups.groupInEditing.submitted);
}

function creatingNewGroup(state) {
	return (state.groups.groupInEditing.id === undefined);
}


function submitGroupInEditingIfNeeded() {
	return (dispatch, getState) => {
		if (shouldSubmitGroupInEditing(getState())) {
			if (creatingNewGroup(getState())) {
				// post
			} else {
				// put
			}
		}
		return Promise.resolve();
	};
}
