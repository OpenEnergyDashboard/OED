/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Dispatch, GetState, Thunk, ActionType } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { NamedIDItem } from '../types/items';
import { showErrorNotification } from '../utils/notifications';
import * as t from '../types/redux/groups';
import { groupsApi } from '../utils/api';
// TODO import { browserHistory } from '../utils/history';
import { showSuccessNotification } from '../utils/notifications';
import translate from '../utils/translate';

function requestGroupsDetails(): t.RequestGroupsDetailsAction {
	return { type: ActionType.RequestGroupsDetails };
}

function receiveGroupsDetails(data: NamedIDItem[]): t.ReceiveGroupsDetailsAction {
	return { type: ActionType.ReceiveGroupsDetails, data };
}

function requestGroupChildren(groupID: number): t.RequestGroupChildrenAction {
	return { type: ActionType.RequestGroupChildren, groupID };
}

function receiveGroupChildren(groupID: number, data: { meters: number[], groups: number[], deepMeters: number[] }): t.ReceiveGroupChildrenAction {
	return { type: ActionType.ReceiveGroupChildren, groupID, data };
}

function requestAllGroupsChildren(): t.RequestAllGroupsChildrenAction {
	return { type: ActionType.RequestAllGroupsChildren };
}

function receiveAllGroupsChildren(data: t.GroupChildren[]): t.ReceiveAllGroupsChildrenAction {
	return { type: ActionType.ReceiveAllGroupsChildren, data };
}

export function changeDisplayedGroups(groupIDs: number[]): t.ChangeDisplayedGroupsAction {
	return { type: ActionType.ChangeDisplayedGroups, groupIDs };
}

export function fetchGroupsDetails(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		dispatch(requestGroupsDetails());
		// Returns the names and IDs of all groups in the groups table.
		const groupsDetails = await groupsApi.details();
		dispatch(receiveGroupsDetails(groupsDetails));
		// If this is the first fetch, inform the store that the first fetch has been made
		if (!getState().groups.hasBeenFetchedOnce) {
			dispatch(confirmGroupsFetchedOnce());
		}
	};
}

export function confirmGroupsFetchedOnce(): t.ConfirmGroupsFetchedOnceAction {
	return { type: ActionType.ConfirmGroupsFetchedOnce };
}

function shouldFetchGroupsDetails(state: State): boolean {
	// If isFetching then don't do this. If already fetched then don't do this.
	return !state.groups.isFetching && !state.groups.hasBeenFetchedOnce;
}

export function fetchGroupsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchGroupsDetails(getState())) {
			return dispatch(fetchGroupsDetails());
		}
		return Promise.resolve();
	};
}

// The following 3 functions do a single groups at a time. They were used
// before the group modals. They are being left in case we want them in
// the future, esp. if modals do not load all at start as they now do.
// They used to have outdated but removed since not used by new code.
function shouldFetchGroupChildren(state: State, groupID: number) {
	const group = state.groups.byGroupID[groupID];
	// Check that it is not being fetched.
	return !group.isFetching;
}

function fetchGroupChildren(groupID: number) {
	return async (dispatch: Dispatch) => {
		dispatch(requestGroupChildren(groupID));
		const childGroupIDs = await groupsApi.children(groupID);
		dispatch(receiveGroupChildren(groupID, childGroupIDs));
	};
}

export function fetchGroupChildrenIfNeeded(groupID: number) {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchGroupChildren(getState(), groupID)) {
			return dispatch(fetchGroupChildren(groupID));
		}
		return Promise.resolve();
	};
}

// The following functions get the immediate children meters and groups of all groups.

function fetchAllGroupChildren(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// ensure a fetch is not currently happening
		if (!getState().groups.isFetchingAllChildren) {
			// set isFetching to true
			dispatch(requestAllGroupsChildren());
			// Retrieve all groups children from database
			const groupsChildren = await groupsApi.getAllGroupsChildren();
			// update the state with all groups children
			dispatch(receiveAllGroupsChildren(groupsChildren));
			// If this is the first fetch, inform the store that the first fetch has been made
			if (!getState().groups.hasChildrenBeenFetchedOnce) {
				dispatch(confirmAllGroupsChildrenFetchedOnce());
			}
		}
	}
}

export function confirmAllGroupsChildrenFetchedOnce(): t.ConfirmAllGroupsChildrenFetchedOnceAction {
	return { type: ActionType.ConfirmAllGroupsChildrenFetchedOnce };
}

export function fetchAllGroupChildrenIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		// If groups have not been fetched once (or that reset) then try to fetch.
		if (!getState().groups.hasChildrenBeenFetchedOnce) {
			return dispatch(fetchAllGroupChildren());
		}
		return Promise.resolve();
	};
}
/**
 * Change the selected child groups of a group.
 * This is tracked on a per-group basis. (I.e., each group has its own list of selected child groups.)
 * @param {number} parentID The ID of the group whose subgroups are being selected
 * @param {number[]} groupIDs The IDs of the new set of selected subgroups
 * @returns {{type: string, groupIDs: [number]}}
 */
export function changeSelectedChildGroupsOfGroup(parentID: number, groupIDs: number[]): t.ChangeSelectedChildGroupsPerGroupAction {
	return { type: ActionType.ChangeSelectedChildGroupsPerGroup, parentID, groupIDs };
}

/**
 * Change which child meters of a group are selected.
 * This is tracked on a per-group basis.
 * @param {number} parentID The ID of the group whose subgroups are being selected
 * @param {number[]} meterIDs The IDs of the new set of selected child meters
 * @returns {{type: string, parentID: number, meterIDs: [number]}}
 */
export function changeSelectedChildMetersOfGroup(parentID: number, meterIDs: number[]): t.ChangeSelectedChildMetersPerGroupAction {
	return { type: ActionType.ChangeSelectedChildMetersPerGroup, parentID, meterIDs };
}

/*
 * The `submitNewGroup` and `submitGroupEdits` functions are called by
 * `submitGroupInEditingIfNeeded` to handle sending the API request
 * and processing the response.
 */
export function submitNewGroup(group: t.GroupData): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			await groupsApi.create(group);
			// Update the groups state from the database on a successful call
			// In the future, getting rid of this database fetch and updating the store on a successful API call would make the page faster
			// However, since the database currently assigns the id to the GroupData
			dispatch(fetchGroupsDetails());
			showSuccessNotification(translate('group.successfully.create.group'));
		} catch (err) {
			// Failure! ):
			// TODO Better way than popup with React but want to stay so user can read/copy.
			window.alert(translate('group.failed.to.edit.group') + '"' + err.response.data as string + '"');
			// Clear our changes from to the submitting meters state
			// We must do this in case fetch failed to keep the store in sync with the database
		}
	};
}

export function confirmGroupEdits(editedGroup: t.GroupEditData): t.ConfirmEditedGroupAction {
	return { type: ActionType.ConfirmEditedGroup, editedGroup };
}

export function submitGroupEdits(group: t.GroupData & t.GroupID): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			await groupsApi.edit(group);
			// Update the store with our new edits
			dispatch(confirmGroupEdits(group));
			// Success!
			showSuccessNotification(translate('group.successfully.edited.group'));
		} catch (e) {
			if (e.response.data.message && e.response.data.message === 'Cyclic group detected') {
				showErrorNotification(translate('you.cannot.create.a.cyclic.group'));
			} else {
				showErrorNotification(translate('group.failed.to.edit.group'));
			}
		}
	};
}

// TODO see if can remove this since not yet used but still need to be able to delete a group.
// export function deleteGroup(): Thunk {
// 	return async (dispatch: Dispatch, getState: GetState) => {
// 		const groupInEditing = getState().groups.groupInEditing as t.GroupDefinition;
// 		if (groupInEditing === undefined) {
// 			throw new Error('Unacceptable condition: state.groups.groupInEditing has no data.');
// 		}
// 		try {
// 			await groupsApi.delete(groupInEditing.id);
// 			dispatch(changeDisplayedGroups([]));
// 			dispatch((dispatch2: Dispatch) => {
// 				browserHistory.push('/groups');
// 			});
// 		} catch (e) {
// 			showErrorNotification(translate('failed.to.delete.group'));
// 		}
// 	};
// }
