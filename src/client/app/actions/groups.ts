/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Dispatch, GetState, Thunk, ActionType } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import * as t from '../types/redux/groups';
import { groupsApi } from '../utils/api';
import translate from '../utils/translate';

function requestGroupsDetails(): t.RequestGroupsDetailsAction {
	return { type: ActionType.RequestGroupsDetails };
}

function receiveGroupsDetails(data: t.GroupDetailsData[]): t.ReceiveGroupsDetailsAction {
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
		// Returns the names, IDs and most info of all groups in the groups table.
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
// They are not currently used but left for now.

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
			// However, since the database currently assigns the id to the GroupData and it is not returned we do the get.
			// We also need to get the child meters/groups of the new group. We can just fetch this one group but instead get all the groups since easier and this
			// is not a common operation. We must wait for the new group state so its substate for children can be set.
			dispatch(fetchGroupsDetails()).then(() => dispatch(fetchAllGroupChildren()));
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

/**
 * Pushes group changes out to DB.
 * @param group The group to update
 * @param reload If true, the window is reloaded to reset everything on change
 * @returns Function to do this for an action
 */
export function submitGroupEdits(group: t.GroupEditData, reload: boolean = true): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			// deepMeters is part of the group state but it is not sent on edit route so remove.
			// Need deep copy so changes don't impact original but not really important if reload.
			const groupNoDeep = { ...group };
			delete groupNoDeep.deepMeters;
			await groupsApi.edit(groupNoDeep);
			// See deleteGroup action for full description but we reload the window
			// to avoid issues with change from one group impacting another.
			// Update the store for all groups.
			// TODO We should limit this to the times it is needed and not all group edits.
			if (reload) {
				window.location.reload();
			} else {
				// If we did not reload then we need to refresh the edited group's state with:
				dispatch(confirmGroupEdits(group));
				// An then we need to fix up any other groups impacted.
				// This is removed since you won't see it.
				// Success!
				showSuccessNotification(translate('group.successfully.edited.group'));
			}
		} catch (e) {
			if (e.response.data.message && e.response.data.message === 'Cyclic group detected') {
				showErrorNotification(translate('you.cannot.create.a.cyclic.group'));
			} else {
				showErrorNotification(translate('group.failed.to.edit.group') + ' "' + e.response.data as string + '"');
			}
		}
	};
}

export function deleteGroup(group: t.GroupEditData): Thunk {
	// TODO This no longer does a dispatch so it may need to be reworked.
	// For now, get to ignore eslint issue.
	/* eslint-disable @typescript-eslint/no-unused-vars */
	return async (dispatch: Dispatch) => {
		/* eslint-enable @typescript-eslint/no-unused-vars */
		try {
			await groupsApi.delete(group.id);
			// We need to remove this group from Redux state. Also, other groups
			// can be changed if they included this group. It should only impact
			// the immediate group children and the deep meters. If any of these
			// groups are being graphed then their readings, etc. need to be updated.
			// Given this isn't done very often and only by an admin, the code
			// reloads the browser so the state is fixed and any graphing is removed.
			// We could just fix the state but that is more complex and the code was
			// having issues redoing the useEffect for edit in this case.
			window.location.reload();
		} catch (e) {
			showErrorNotification(translate('failed.to.delete.group'));
		}
	};
}
