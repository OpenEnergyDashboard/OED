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
	| RequestAllGroupsChildrenAction
	| ReceiveAllGroupsChildrenAction
	| ChangeDisplayedGroupsAction
	| ChangeSelectedChildGroupsPerGroupAction
	| ChangeSelectedChildMetersPerGroupAction
	| ConfirmEditedGroupAction
	| ConfirmGroupsFetchedOnceAction
	| ConfirmAllGroupsChildrenFetchedOnceAction
	;

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
	data: { meters: number[], groups: number[], deepMeters: number[] };
}

export interface RequestAllGroupsChildrenAction {
	type: ActionType.RequestAllGroupsChildren;
}

export interface ReceiveAllGroupsChildrenAction {
	type: ActionType.ReceiveAllGroupsChildren;
	data: GroupChildren[];
}

export interface ConfirmEditedGroupAction {
	type: ActionType.ConfirmEditedGroup;
	editedGroup: GroupEditData;
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

export interface ConfirmGroupsFetchedOnceAction {
	type: ActionType.ConfirmGroupsFetchedOnce;
}

export interface ConfirmAllGroupsChildrenFetchedOnceAction {
	type: ActionType.ConfirmAllGroupsChildrenFetchedOnce
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
	gps: GPSPoint | null;
	displayable: boolean;
	note?: string;
	// TODO with area? you get a TS error but without it lets null through (see web console).
	area: number;
	defaultGraphicUnit: number;
}

export interface GroupEditData {
	id: number,
	name: string;
	childMeters: number[];
	childGroups: number[];
	gps: GPSPoint | null;
	displayable: boolean;
	note?: string;
	// TODO with area? you get a TS error but without it lets null through (see web console).
	area: number;
	defaultGraphicUnit: number;
}

export interface GroupID {
	id: number;
}

export interface GroupDeepMeters {
	deepMeters: number[];
}

// TODO this duplicates two fields in ones above so decide if should somehow merge.
export interface GroupChildren {
	// Which group id this applies to
	groupId: number;
	// All the immediate children of this group.
	childMeters: number[];
	// All the immediate groups of this group.
	childGroups: number[];
}

export type GroupDefinition = GroupData & GroupMetadata & GroupID & GroupDeepMeters;

export interface StatefulEditable {
	dirty: boolean;
	submitted?: boolean;
}

export interface GroupsState {
	hasBeenFetchedOnce: boolean;
	// If all groups child meters/groups are in state.
	hasChildrenBeenFetchedOnce: boolean;
	isFetching: boolean;
	// If fetching all groups child meters/groups.
	isFetchingAllChildren: boolean;
	outdated: boolean;
	byGroupID: {
		[groupID: number]: GroupDefinition;
	};
	selectedGroups: number[];
	// TODO groupInEditing: GroupDefinition & StatefulEditable | StatefulEditable;
	displayMode: DisplayMode;
}
