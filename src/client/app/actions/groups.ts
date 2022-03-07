/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Dispatch, GetState, Thunk, ActionType } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { NamedIDItem } from '../types/items';
import { showErrorNotification } from '../utils/notifications';
import * as t from '../types/redux/groups';
import { groupsApi } from '../utils/api';
import { browserHistory } from '../utils/history';
import translate from '../utils/translate';
import { GPSPoint } from 'utils/calibration';

function requestGroupsDetails(): t.RequestGroupsDetailsAction {
	return { type: ActionType.RequestGroupsDetails };
}

function receiveGroupsDetails(data: NamedIDItem[]): t.ReceiveGroupsDetailsAction {
	return { type: ActionType.ReceiveGroupsDetails, data };
}

function requestGroupChildren(groupID: number): t.RequestGroupChildrenAction {
	return { type: ActionType.RequestGroupChildren, groupID };
}

function receiveGroupChildren(groupID: number, data: {meters: number[], groups: number[]}): t.ReceiveGroupChildrenAction {
	return { type: ActionType.ReceiveGroupChildren, groupID, data };
}

export function changeDisplayedGroups(groupIDs: number[]): t.ChangeDisplayedGroupsAction {
	return { type: ActionType.ChangeDisplayedGroups, groupIDs };
}

export function fetchGroupsDetails(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestGroupsDetails());
		// Returns the names and IDs of all groups in the groups table.
		const groupsDetails = await groupsApi.details();
		return dispatch(receiveGroupsDetails(groupsDetails));
	};
}

function shouldFetchGroupsDetails(state: State): boolean {
	return !state.groups.isFetching && state.groups.outdated;
}

export function fetchGroupsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchGroupsDetails(getState())) {
			return dispatch(fetchGroupsDetails());
		}
		return Promise.resolve();
	};
}

function shouldFetchGroupChildren(state: State, groupID: number) {
	const group = state.groups.byGroupID[groupID];
	// Check that the group is outdated AND that it is not being fetched.
	return group.outdated && !group.isFetching;
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

/**
 * Change the selected child groups of a group.
 * This is tracked on a per-group basis. (I.e., each group has its own list of selected child groups.)
 * @param parentID The ID of the group whose subgroups are being selected
 * @param groupIDs The IDs of the new set of selected subgroups
 * @return {{type: string, groupIDs: *}}
 */
export function changeSelectedChildGroupsOfGroup(parentID: number, groupIDs: number[]): t.ChangeSelectedChildGroupsPerGroupAction {
	return { type: ActionType.ChangeSelectedChildGroupsPerGroup, parentID, groupIDs };
}

/**
 * Change which child meters of a group are selected.
 * This is tracked on a per-group basis.
 * @param parentID The ID of the group whose subgroups are being selected
 * @param meterIDs The IDs of the new set of selected child meters
 * @return {{type: string, parentID: *, meterIDs: *}}
 */
export function changeSelectedChildMetersOfGroup(parentID: number, meterIDs: number[]): t.ChangeSelectedChildMetersPerGroupAction {
	return { type: ActionType.ChangeSelectedChildMetersPerGroup, parentID, meterIDs };
}

/**
 * Change the display mode of the groups page
 * @param newMode Either 'view', 'edit', or 'create'
 * @return {{type: string, newMode: String}}
 */
export function changeDisplayMode(newMode: t.DisplayMode): t.ChangeDisplayModeAction {
	return { type: ActionType.ChangeGroupsUIDisplayMode, newMode };
}

/**
 * Set state.groups.groupInEditing to a blank group
 * @return {{type: string}}
 */
export function createNewBlankGroup(): t.CreateNewBlankGroupAction {
	return { type: ActionType.CreateNewBlankGroup };
}

// Fire the action to actually overwrite `groupInEditing`
function beginEditingGroup(groupID: number): t.BeginEditingGroupAction {
	return { type: ActionType.BeginEditingGroup, groupID };
}

// Check if `groupInEditing` is clean (can it be overwritten).
function canBeginEditing(state: State): boolean {
	return !state.groups.groupInEditing.dirty;
}

/**
 * Copy the group with the given ID into `groupInEditing` if allowed.
 * @param groupID The ID of the group to be edited
 * @return {function(*, *)}
 */
export function beginEditingIfPossible(groupID: number): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (canBeginEditing(getState())) {
			dispatch(fetchGroupChildrenIfNeeded(groupID));
			dispatch(beginEditingGroup(groupID));
		}
		return Promise.resolve();
	};
}

/**
 * Change the name of the group in editing
 * @param newName The new name
 * @return {{type: string, newName: String}}
 */
export function editGroupName(newName: string): t.EditGroupNameAction {
	return { type: ActionType.EditGroupName, newName };
}

/**
 * Change the GPS of the group in editing
 * @param newGPS The new GPS
 * @return {{type: string, newGPS: GPSPoint}}
 */
export function editGroupGPS(newGPS: GPSPoint): t.EditGroupGPSAction {
	return { type: ActionType.EditGroupGPS, newGPS };
}

/**
 * Change the displayable of the group in editing
 * @param newDisplay The new displayable
 * @return {{type: string, newDisplay: boolean}}
 */
export function editGroupDisplayable(newDisplay: boolean): t.EditGroupDisplayableAction {
	return { type: ActionType.EditGroupDisplayable, newDisplay };
}

/**
 * Change the note of the group in editing
 * @param newNote The new name
 * @return {{type: string, newNote: String}}
 */
export function editGroupNote(newNote: string): t.EditGroupNoteAction {
	return { type: ActionType.EditGroupNote, newNote };
}

/**
 * Change the area of the group in editing
 * @param newArea The new area
 * @return {{type: string, newArea: number}}
 */
export function editGroupArea(newArea: number): t.EditGroupAreaAction {
	return { type: ActionType.EditGroupArea, newArea };
}

/**
 * Change the child groups of the group in editing
 * @param groupIDs IDs of the new child groups
 * @return {{type: string, groupIDs: [Int]}}
 */
export function changeChildGroups(groupIDs: number[]): t.ChangeChildGroupsAction {
	return { type: ActionType.ChangeChildGroups, groupIDs };
}
/**
 * Change the child meters of the group in editing
 * @param meterIDs IDs of the new set of child meters
 * @return {{type: string, meterIDs: [Int]}}
 */
export function changeChildMeters(meterIDs: number[]): t.ChangeChildMetersAction {
	return { type: ActionType.ChangeChildMeters, meterIDs };
}

// Record whether or not a request to submit edits to the database has been sent
function markGroupInEditingSubmitted(): t.MarkGroupInEditingSubmittedAction {
	return { type: ActionType.MarkGroupInEditingSubmitted };
}
function markGroupInEditingNotSubmitted(): t.MarkGroupInEditingNotSubmittedAction {
	return { type: ActionType.MarkGroupInEditingNotSubmitted };
}

/**
 * Use this to cancel group editing and allow `groupInEditing` to be overwritten later.
 * `groupInEditing` is dirty when it is storing changes that have not yet been committed to the database.
 * It is not clean until a request to store the changes has received a successful response.
 * @return {{type: string}}
 */
export function markGroupInEditingClean(): t.MarkGroupInEditingCleanAction {
	return { type: ActionType.MarkGroupInEditingClean };
}

function markGroupInEditingDirty(): t.MarkGroupInEditingDirtyAction {
	return { type: ActionType.MarkGroupInEditingDirty };
}

/*
 * Mark all the data in `byGroupID` as outdated.
 * This data is out of date when the name of a group may have changed, or when a group ahs been created.
 * groupDetails will be re-fetched at the next opportunity.
 */
function markGroupsOutdated(): t.MarkGroupsOutdatedAction {
	return { type: ActionType.MarkGroupsByIDOutdated };
}
/*
 * Mark a single group as outdated.
 * This data is out of date when its children may have changed.
 * This is not essential at the moment, but will become essential when we try to limit the number of times we fetch all
 * groups.
 */
function markOneGroupOutdated(groupID: number): t.MarkOneGroupOutdatedAction {
	return { type: ActionType.MarkOneGroupOutdated, groupID };
}

function shouldSubmitGroupInEditing(state: State): boolean {
	// Should submit if there are uncommitted changes and they have not already been submitted
	return state.groups.groupInEditing.dirty && !(state.groups.groupInEditing.submitted);
}

function creatingNewGroup(state: State): boolean {
	// If the group in editing lacks an ID, we are creating a new group
	const id = (state.groups.groupInEditing as t.GroupDefinition).id;
	return (id === undefined);
}

/*
 * The `submitNewGroup` and `submitGroupEdits` functions are called by
 * `submitGroupInEditingIfNeeded` to handle sending the API request
 * and processing the response.
 */
function submitNewGroup(group: t.GroupData): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(markGroupInEditingSubmitted());
		try {
			await groupsApi.create(group);
			dispatch(markGroupsOutdated());
			dispatch((dispatch2: Dispatch) => {
				dispatch2(markGroupInEditingClean());
			});
		} catch (e) {
			dispatch(markGroupInEditingNotSubmitted());
			if (e.response !== undefined && e.response.status === 400) {
				showErrorNotification(translate('400'));
			} else {
				showErrorNotification(translate('failed.to.create.group'));
			}
		}
	};
}

function submitGroupEdits(group: t.GroupData & t.GroupID): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(markGroupInEditingSubmitted());
		try {
			await groupsApi.edit(group);
			dispatch(markGroupsOutdated());
			dispatch(markOneGroupOutdated(group.id));
			dispatch((dispatch2: Dispatch) => {
				dispatch2(markGroupInEditingClean());
			});
		} catch (e) {
			dispatch(markGroupInEditingNotSubmitted());
			if (e.response.data.message && e.response.data.message === 'Cyclic group detected') {
				showErrorNotification(translate('you.cannot.create.a.cyclic.group'));
			} else {
				showErrorNotification(translate('failed.to.edit.group'));
			}
		}
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
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldSubmitGroupInEditing(getState())) {
			const rawGroup = getState().groups.groupInEditing as t.GroupDefinition;
			if (rawGroup === undefined) {
				throw new Error('Unacceptable condition: state.groups.groupInEditing has no data.');
			}
			const group = {
				name: rawGroup.name,
				childGroups: rawGroup.childGroups,
				childMeters: rawGroup.childMeters,
				gps: rawGroup.gps,
				displayable: rawGroup.displayable,
				note: rawGroup.note,
				area: rawGroup.area
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

export function deleteGroup(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		dispatch(markGroupInEditingDirty());
		const groupInEditing = getState().groups.groupInEditing as t.GroupDefinition;
		if (groupInEditing === undefined) {
			throw new Error('Unacceptable condition: state.groups.groupInEditing has no data.');
		}
		try {
			await groupsApi.delete(groupInEditing.id);
			dispatch(markGroupsOutdated());
			dispatch(changeDisplayedGroups([]));
			dispatch((dispatch2: Dispatch) => {
				dispatch2(markGroupInEditingClean());
				browserHistory.push('/groups');
			});
		} catch (e) {
			showErrorNotification(translate('failed.to.delete.group'));
		}
	};
}
