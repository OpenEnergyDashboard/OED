/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';
import { NamedIDItem } from '../items';
import { GPSPoint } from 'utils/calibration';

export enum DisplayMode { View = 'view', Edit = 'edit', Create = 'create' }

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
	| EditGroupGPSAction
	| EditGroupDisplayableAction
	| EditGroupNoteAction
	| EditGroupAreaAction
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

export interface EditGroupGPSAction {
	type: ActionType.EditGroupGPS;
	newGPS: GPSPoint;
}

export interface EditGroupDisplayableAction {
	type: ActionType.EditGroupDisplayable;
	newDisplay: boolean;
}

export interface EditGroupNoteAction {
	type: ActionType.EditGroupNote;
	newNote: string;
}

export interface EditGroupAreaAction {
	type: ActionType.EditGroupArea;
	newArea: number;
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

export interface GroupMetadata {
	isFetching: boolean;
	outdated: boolean;
	selectedGroups: number[];
	selectedMeters: number[];
}

export interface GroupData {
	name: string;
	childMeters: number[];
	childGroups: number[];
	gps?: GPSPoint;
	displayable: boolean;
	note?: string;
	area?: number;
}

export interface GroupID {
	id: number;
}

export type GroupDefinition = GroupData & GroupMetadata & GroupID;

export interface StatefulEditable {
	dirty: boolean;
	submitted?: boolean;
}

export interface GroupsState {
	isFetching: boolean;
	outdated: boolean;
	byGroupID: {
		[groupID: number]: GroupDefinition;
	};
	selectedGroups: number[];
	groupInEditing: GroupDefinition & StatefulEditable | StatefulEditable;
	displayMode: DisplayMode;
}
