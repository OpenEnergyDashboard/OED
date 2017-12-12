/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';
import { getToken } from '../utils/token';
import { State, Dispatch, GetState, Thunk, TerminalThunk, ActionType } from '../types/redux';
import { NamedIDItem } from '../types/items';
import { showErrorNotification } from '../utils/notifications';
import { StatefulEditable, GroupDefinition, GroupData, GroupID } from '../reducers/groups';

export type GroupsAction =
	| RequestGroupsDetailsAction
	| ReceiveGroupsDetailsAction
	| RequestGroupChildrenAction
	| ReceiveGroupChildrenAction
	| ChangeDisplayedGroupsAction
	| ChangeSelectedChildGroupsPerGroupAction
	| ChangeSelectedChildMetersPerGroupAction
	| ChangeDisplayModeAction
	| CreateNewBlankGroupAction
	| BeginEditingGroupAction
	| EditGroupNameAction
	| ChangeChildGroupsAction
	| ChangeChildMetersAction
	| MarkGroupInEditingSubmittedAction
	| MarkGroupInEditingNotSubmittedAction
	| MarkGroupInEditingCleanAction
	| MarkGroupInEditingDirtyAction
	| MarkGroupsOutdatedAction
	| MarkOneGroupOutdatedAction;

export interface RequestGroupsDetailsAction {
	type: ActionType.RequestGroupsDetails;
}

export interface ReceiveGroupsDetailsAction {
	type: ActionType.ReceiveGroupsDetails;
	data: NamedIDItem[];
}

export interface RequestGroupChildrenAction {
	type: ActionType.RequestGroupChildren;
	groupID: number;
}

export interface ReceiveGroupChildrenAction {
	type: ActionType.ReceiveGroupChildren;
	groupID: number;
	data: {meters: number[], groups: number[]};
}

export interface ChangeDisplayedGroupsAction {
	type: ActionType.ChangeDisplayedGroups;
	groupIDs: number[];
}

export interface ChangeSelectedChildGroupsPerGroupAction {
	type: ActionType.ChangeSelectedChildGroupsPerGroup;
	parentID: number;
	groupIDs: number[];
}

export interface ChangeSelectedChildMetersPerGroupAction {
	type: ActionType.ChangeSelectedChildMetersPerGroup;
	parentID: number;
	meterIDs: number[];
}

function requestGroupsDetails(): RequestGroupsDetailsAction {
	return { type: ActionType.RequestGroupsDetails };
}

function receiveGroupsDetails(data: NamedIDItem[]): ReceiveGroupsDetailsAction {
	return { type: ActionType.ReceiveGroupsDetails, data };
}

function requestGroupChildren(groupID: number): RequestGroupChildrenAction {
	return { type: ActionType.RequestGroupChildren, groupID };
}

function receiveGroupChildren(groupID: number, data: {meters: number[], groups: number[]}): ReceiveGroupChildrenAction {
	return { type: ActionType.ReceiveGroupChildren, groupID, data };
}

export function changeDisplayedGroups(groupIDs: number[]): ChangeDisplayedGroupsAction {
	return { type: ActionType.ChangeDisplayedGroups, groupIDs };
}

function fetchGroupsDetails(): Thunk {
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
function shouldFetchGroupsDetails(state: State): boolean {
	return !state.groups.isFetching && state.groups.outdated;
}

/**
 * @returns {function(*, *)}
 */
export function fetchGroupsDetailsIfNeeded(): Thunk {
	return (dispatch, getState) => {
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
	return (dispatch: Dispatch) => {
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
export function changeSelectedChildGroupsOfGroup(parentID: number, groupIDs: number[]): ChangeSelectedChildGroupsPerGroupAction {
	return { type: ActionType.ChangeSelectedChildGroupsPerGroup, parentID, groupIDs };
}

/**
 * Change which child meters of a group are selected.
 * This is tracked on a per-group basis.
 * @param parentID The ID of the group whose subgroups are being selected
 * @param meterIDs The IDs of the new set of selected child meters
 * @return {{type: string, parentID: *, meterIDs: *}}
 */
export function changeSelectedChildMetersOfGroup(parentID: number, meterIDs: number[]): ChangeSelectedChildMetersPerGroupAction {
	return { type: ActionType.ChangeSelectedChildMetersPerGroup, parentID, meterIDs };
}


/*
 * The following are functions related to creation and editing of groups.
 */

export enum DisplayMode { View = 'view', Edit = 'edit', Create = 'create' }

export interface ChangeDisplayModeAction {
	type: ActionType.ChangeGroupsUIDisplayMode;
	newMode: DisplayMode;
}

export interface CreateNewBlankGroupAction {
	type: ActionType.CreateNewBlankGroup;
}

export interface BeginEditingGroupAction {
	type: ActionType.BeginEditingGroup;
	groupID: number;
}

export interface EditGroupNameAction {
	type: ActionType.EditGroupName;
	newName: string;
}

export interface ChangeChildGroupsAction {
	type: ActionType.ChangeChildGroups;
	groupIDs: number[];
}

export interface ChangeChildMetersAction {
	type: ActionType.ChangeChildMeters;
	meterIDs: number[];
}

export interface MarkGroupInEditingSubmittedAction {
	type: ActionType.MarkGroupInEditingSubmitted;
}

export interface MarkGroupInEditingNotSubmittedAction {
	type: ActionType.MarkGroupInEditingNotSubmitted;
}

export interface MarkGroupInEditingCleanAction {
	type: ActionType.MarkGroupInEditingClean;
}

export interface MarkGroupInEditingDirtyAction {
	type: ActionType.MarkGroupInEditingDirty;
}

export interface MarkGroupsOutdatedAction {
	type: ActionType.MarkGroupsByIDOutdated;
}

export interface MarkOneGroupOutdatedAction {
	type: ActionType.MarkOneGroupOutdated;
	groupID: number;
}

/**
 * Change the display mode of the groups page
 * @param newMode Either 'view', 'edit', or 'create'
 * @return {{type: string, newMode: String}}
 */
export function changeDisplayMode(newMode: DisplayMode): ChangeDisplayModeAction {
	return { type: ActionType.ChangeGroupsUIDisplayMode, newMode };
}

/**
 * Set state.groups.groupInEditing to a blank group
 * @return {{type: string}}
 */
export function createNewBlankGroup(): CreateNewBlankGroupAction {
	return { type: ActionType.CreateNewBlankGroup };
}

// Fire the action to actually overwrite `groupInEditing`
function beginEditingGroup(groupID: number): BeginEditingGroupAction {
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
export function beginEditingIfPossible(groupID: number): TerminalThunk {
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
export function editGroupName(newName: string): EditGroupNameAction {
	return { type: ActionType.EditGroupName, newName };
}

/**
 * Change the child groups of the group in editing
 * @param groupIDs IDs of the new child groups
 * @return {{type: string, groupIDs: [Int]}}
 */
export function changeChildGroups(groupIDs: number[]): ChangeChildGroupsAction {
	return { type: ActionType.ChangeChildGroups, groupIDs };
}
/**
 * Change the child meters of the group in editing
 * @param meterIDs IDs of the new set of child meters
 * @return {{type: string, meterIDs: [Int]}}
 */
export function changeChildMeters(meterIDs: number[]): ChangeChildMetersAction {
	return { type: ActionType.ChangeChildMeters, meterIDs };
}

// Record whether or not a request to submit edits to the database has been sent
function markGroupInEditingSubmitted(): MarkGroupInEditingSubmittedAction {
	return { type: ActionType.MarkGroupInEditingSubmitted };
}
function markGroupInEditingNotSubmitted(): MarkGroupInEditingNotSubmittedAction {
	return { type: ActionType.MarkGroupInEditingNotSubmitted };
}

/**
 * Use this to cancel group editing and allow `groupInEditing` to be overwritten later.
 * `groupInEditing` is dirty when it is storing changes that have not yet been committed to the database.
 * It is not clean until a request to store the changes has received a successful response.
 * @return {{type: string}}
 */
export function markGroupInEditingClean(): MarkGroupInEditingCleanAction {
	return { type: ActionType.MarkGroupInEditingClean };
}

function markGroupInEditingDirty(): MarkGroupInEditingDirtyAction {
	return { type: ActionType.MarkGroupInEditingDirty };
}

/*
 * Mark all the data in `byGroupID` as outdated.
 * This data is out of date when the name of a group may have changed, or when a group ahs been created.
 * groupDetails will be re-fetched at the next opportunity.
 */
function markGroupsOutdated(): MarkGroupsOutdatedAction {
	return { type: ActionType.MarkGroupsByIDOutdated };
}
/*
 * Mark a single group as outdated.
 * This data is out of date when its children may have changed.
 * This is not essential at the moment, but will become essential when we try to limit the number of times we fetch all
 * groups.
 */
function markOneGroupOutdated(groupID: number): MarkOneGroupOutdatedAction {
	return { type: ActionType.MarkOneGroupOutdated, groupID };
}

function shouldSubmitGroupInEditing(state: State): boolean {
	// Should submit if there are uncommitted changes and they have not already been submitted
	return state.groups.groupInEditing.dirty && !(state.groups.groupInEditing.submitted);
}

function creatingNewGroup(state: State): boolean {
	// If the group in editing lacks an ID, we are creating a new group
	const id = state.groups.groupInEditing as GroupDefinition;
	return (id === undefined);
}

/*
 * The `submitNewGroup` and `submitGroupEdits` functions are called by
 * `submitGroupInEditingIfNeeded` to handle sending the API request
 * and processing the response.
 */
function submitNewGroup(group: GroupData): Thunk {
	return dispatch => {
		dispatch(markGroupInEditingSubmitted());
		return axios.post('api/groups/create', group)
			.then(() => {
				dispatch(markGroupsOutdated());
				dispatch(dispatch2 => {
					dispatch2(markGroupInEditingClean());
					dispatch2(changeDisplayMode(DisplayMode.View));
				});
			})
			.catch(error => {
				dispatch(markGroupInEditingNotSubmitted());
				showErrorNotification('Failed to create group');
			});
	};
}

function submitGroupEdits(group: GroupData & GroupID): Thunk {
	return dispatch => {
		dispatch(markGroupInEditingSubmitted());
		return axios.put('api/groups/edit', group)
			.then(() => {
				dispatch(markGroupsOutdated());
				dispatch(markOneGroupOutdated(group.id));
				dispatch(dispatch2 => {
					dispatch2(markGroupInEditingClean());
					dispatch2(changeDisplayMode(DisplayMode.View));
				});
			})
			.catch(error => {
				dispatch(markGroupInEditingNotSubmitted());
				showErrorNotification('Failed to edit group');
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
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldSubmitGroupInEditing(getState())) {
			const rawGroup = getState().groups.groupInEditing as GroupDefinition;
			if (rawGroup === undefined) {
				throw new Error('Unacceptable condition: state.groups.groupInEditing has no data.');
			}
			const group = {
				token: getToken(),
				name: rawGroup.name,
				childGroups: rawGroup.childGroups,
				childMeters: rawGroup.childMeters
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
export function deleteGroup(): TerminalThunk {
	return (dispatch, getState) => {
		dispatch(markGroupInEditingDirty());
		const groupInEditing = getState().groups.groupInEditing as GroupDefinition;
		if (groupInEditing === undefined) {
			throw new Error('Unacceptable condition: state.groups.groupInEditing has no data.');
		}
		const params = {
			groupInEditing,
			token: getToken()
		};
		return axios.post('api/groups/delete', params)
			.then(() => {
				dispatch(markGroupsOutdated());
				dispatch(changeDisplayedGroups([]));
				dispatch(dispatch2 => {
					dispatch2(markGroupInEditingClean());
					dispatch2(changeDisplayMode(DisplayMode.View));
				});
			})
			.catch(() => {
				showErrorNotification('Failed to delete group');
			});
	};
}
