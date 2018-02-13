/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';
import { getToken } from '../utils/token';
import { showErrorNotification } from '../utils/notifications';

// View and fetching actions
export const REQUEST_GROUPS_DETAILS = 'REQUEST_GROUPS_DETAILS';
export const RECEIVE_GROUPS_DETAILS = 'RECEIVE_GROUPS_DETAILS';

export const REQUEST_GROUP_CHILDREN = 'REQUEST_GROUP_CHILDREN';
export const RECEIVE_GROUP_CHILDREN = 'RECEIVE_GROUP_CHILDREN';

export const CHANGE_SELECTED_CHILD_GROUPS_PER_GROUP = 'CHANGE_SELECTED_CHILD_GROUPS_PER_GROUP';
export const CHANGE_SELECTED_CHILD_METERS_PER_GROUP = 'CHANGE_SELECTED_CHILD_METERS_PER_GROUP';
export const CHANGE_DISPLAYED_GROUPS = 'CHANGE_DISPLAYED_GROUPS';

// Viewing and fetching functions

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
	return !state.groups.isFetching && state.groups.outdated;
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
	// Check that the group is outdated AND that it is not being fetched.
	return group.outdated && !group.isFetching;
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
	return { type: CHANGE_DISPLAYED_GROUPS, groupIDs };
}

/**
 * Change the selected child groups of a group.
 * This is tracked on a per-group basis. (I.e., each group has its own list of selected child groups.)
 * @param parentID The ID of the group whose subgroups are being selected
 * @param groupIDs The IDs of the new set of selected subgroups
 * @return {{type: string, groupIDs: *}}
 */
export function changeSelectedChildGroupsOfGroup(parentID, groupIDs) {
	return { type: CHANGE_SELECTED_CHILD_GROUPS_PER_GROUP, parentID, groupIDs };
}

/**
 * Change which child meters of a group are selected.
 * This is tracked on a per-group basis.
 * @param parentID The ID of the group whose subgroups are being selected
 * @param meterIDs The IDs of the new set of selected child meters
 * @return {{type: string, parentID: *, meterIDs: *}}
 */
export function changeSelectedChildMetersOfGroup(parentID, meterIDs) {
	return { type: CHANGE_SELECTED_CHILD_METERS_PER_GROUP, parentID, meterIDs };
}


/*
 * The following are the action definitions and functions related to creation and editing of groups.
 * The functions are listed generally in the same order as the related action definitions.
 */
export const CHANGE_GROUPS_UI_DISPLAY_MODE = 'CHANGE_GROUPS_UI_DISPLAY_MODE';

export const CREATE_NEW_BLANK_GROUP = 'CREATE_NEW_BLANK_GROUP';
export const BEGIN_EDITING_GROUP = 'BEGIN_EDITING_GROUP';

export const EDIT_GROUP_NAME = 'EDIT_GROUP_NAME';
export const CHANGE_CHILD_GROUPS = 'CHANGE_CHILD_GROUPS';
export const CHANGE_CHILD_METERS = 'CHANGE_CHILD_METERS';

export const MARK_GROUP_IN_EDITING_SUBMITTED = 'MARK_GROUP_IN_EDITING_SUBMITTED';
export const MARK_GROUP_IN_EDITING_NOT_SUBMITTED = 'MARK_GROUP_IN_EDITING_NOT_SUBMITTED';

export const MARK_GROUP_IN_EDITING_CLEAN = 'MARK_GROUP_IN_EDITING_CLEAN';
export const MARK_GROUP_IN_EDITING_DIRTY = 'MARK_GROUP_IN_EDITING_DIRTY';

export const MARK_GROUPS_BY_ID_OUTDATED = 'MARK_GROUPS_BY_ID_OUTDATED';

export const MARK_ONE_GROUP_OUTDATED = 'MARK_ONE_GROUP_OUTDATED';
export const DISPLAY_MODE = { VIEW: 'view', EDIT: 'edit', CREATE: 'create' };

/**
 * Change the display mode of the groups page
 * @param newMode Either 'view', 'edit', or 'create'
 * @return {{type: string, newMode: String}}
 */
export function changeDisplayMode(newMode) {
	return { type: CHANGE_GROUPS_UI_DISPLAY_MODE, newMode };
}

/**
 * Set state.groups.groupInEditing to a blank group
 * @return {{type: string}}
 */
export function createNewBlankGroup() {
	return { type: CREATE_NEW_BLANK_GROUP };
}

// Fire the action to actually overwrite `groupInEditing`
function beginEditingGroup(groupID) {
	return { type: BEGIN_EDITING_GROUP, groupID };
}

// Check if `groupInEditing` is clean (can it be overwritten).
function canBeginEditing(state) {
	return !state.groups.groupInEditing.dirty;
}

/**
 * Copy the group with the given ID into `groupInEditing` if allowed.
 * @param groupID The ID of the group to be edited
 * @return {function(*, *)}
 */
export function beginEditingIfPossible(groupID) {
	return (dispatch, getState) => {
		if (canBeginEditing(getState())) {
			dispatch(fetchGroupChildrenIfNeeded(groupID));
			dispatch(beginEditingGroup(groupID));
		}
	};
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

// Record whether or not a request to submit edits to the database has been sent
function markGroupInEditingSubmitted() {
	return { type: MARK_GROUP_IN_EDITING_SUBMITTED };
}
function markGroupInEditingNotSubmitted() {
	return { type: MARK_GROUP_IN_EDITING_NOT_SUBMITTED };
}

/**
 * Use this to cancel group editing and allow `groupInEditing` to be overwritten later.
 * `groupInEditing` is dirty when it is storing changes that have not yet been committed to the database.
 * It is not clean until a request to store the changes has received a successful response.
 * @return {{type: string}}
 */
export function markGroupInEditingClean() {
	return { type: MARK_GROUP_IN_EDITING_CLEAN };
}

function markGroupInEditingDirty() {
	return { type: MARK_GROUP_IN_EDITING_DIRTY };
}

/*
 * Mark all the data in `byGroupID` as outdated.
 * This data is out of date when the name of a group may have changed, or when a group ahs been created.
 * groupDetails will be re-fetched at the next opportunity.
 */
function markGroupsOutdated() {
	return { type: MARK_GROUPS_BY_ID_OUTDATED };
}
/*
 * Mark a single group as outdated.
 * This data is out of date when its children may have changed.
 * This is not essential at the moment, but will become essential when we try to limit the number of times we fetch all
 * groups.
 */
function markOneGroupOutdated(groupID) {
	return { type: MARK_ONE_GROUP_OUTDATED, groupID };
}

function shouldSubmitGroupInEditing(state) {
	// Should submit if there are uncommitted changes and they have not already been submitted
	return state.groups.groupInEditing.dirty && !(state.groups.groupInEditing.submitted);
}

function creatingNewGroup(state) {
	// If the group in editing lacks an ID, we are creating a new group
	return (state.groups.groupInEditing.id === undefined);
}

/*
 * The `submitNewGroup` and `submitGroupEdits` functions are called by
 * `submitGroupInEditingIfNeeded` to handle sending the API request
 * and processing the response.
 */
function submitNewGroup(group) {
	return dispatch => {
		dispatch(markGroupInEditingSubmitted());
		return axios.post('api/groups/create', group)
			.then(() => {
				dispatch(markGroupsOutdated());
				dispatch(dispatch2 => {
					dispatch2(markGroupInEditingClean());
					dispatch2(changeDisplayMode(DISPLAY_MODE.VIEW));
				});
			})
			.catch(() => {
				dispatch(markGroupInEditingNotSubmitted());
				showErrorNotification('Failed to create a new group');
			});
	};
}

function submitGroupEdits(group) {
	return dispatch => {
		dispatch(markGroupInEditingSubmitted());
		return axios.put('api/groups/edit', group)
			.then(() => {
				dispatch(markGroupsOutdated());
				dispatch(markOneGroupOutdated(group.id));
				dispatch(dispatch2 => {
					dispatch2(markGroupInEditingClean());
					dispatch2(changeDisplayMode(DISPLAY_MODE.VIEW));
				});
			})
			.catch(e => {
				dispatch(markGroupInEditingNotSubmitted());
				if (e.response.data.message && e.response.data.message === 'Cyclic group detected') {
					showErrorNotification('You cannot create a cyclic group');
				} else {
					showErrorNotification('Failed to edit group');
				}
			});
	};
}

/**
 * Checks if `groupInEditing` is dirty and not not submitted.
 * If this is the case, decides whether it is a new group
 * being created, or an old group being edited, and calls the
 * appropriate helper function to handle the request.
 * @return {function(*, *)}
 */
export function submitGroupInEditingIfNeeded() {
	return (dispatch, getState) => {
		if (shouldSubmitGroupInEditing(getState())) {
			const rawGroup = getState().groups.groupInEditing;
			const group = {
				token: getToken(),
				name: rawGroup.name,
				childGroups: rawGroup.childGroups,
				childMeters: rawGroup.childMeters,
			};
			if (creatingNewGroup(getState())) {
				return dispatch(submitNewGroup(group));
			} else {
				const groupWithID = {
					...group,
					id: rawGroup.id
				};
				return dispatch(submitGroupEdits(groupWithID));
			}
		}
		return Promise.resolve();
	};
}

/**
 * Deletes the group in editing
 * @returns {function(*, *)}
 */
export function deleteGroup() {
	return (dispatch, getState) => {
		dispatch(markGroupInEditingDirty());
		const params = {
			id: getState().groups.groupInEditing.id,
			token: getToken()
		};
		return axios.post('api/groups/delete', params)
			.then(() => {
				dispatch(markGroupsOutdated());
				dispatch(changeDisplayedGroups([]));
				dispatch(dispatch2 => {
					dispatch2(markGroupInEditingClean());
					dispatch2(changeDisplayMode('view'));
				});
			})
			.catch(() => {
				showErrorNotification('Failed to delete group');
			});
	};
}
