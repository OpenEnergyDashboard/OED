/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { GPSPoint } from 'utils/calibration';
import { AreaUnitType } from 'utils/getAreaUnitConversion';

export enum DisplayMode { View = 'view', Edit = 'edit', Create = 'create' }
export interface GroupMetadata {
	isFetching: boolean;
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
	areaUnit: AreaUnitType;
}

export interface GroupEditData {
	id: number,
	name: string;
	childMeters: number[];
	childGroups: number[];
	// This is optional since it is in Redux state and used during group editing but not sent in route.
	deepMeters?: number[];
	gps: GPSPoint | null;
	displayable: boolean;
	note?: string;
	// TODO with area? you get a TS error but without it lets null through (see web console).
	area: number;
	defaultGraphicUnit: number;
	areaUnit: AreaUnitType;
}

// TODO This is similar to GroupEditData but without the children. Should be able to
// fuse and clean up.
export interface GroupDetailsData {
	id: number,
	name: string;
	// This is optional since it is in Redux state and used during group editing but not sent in route.
	deepMeters?: number[];
	gps: GPSPoint | null;
	displayable: boolean;
	note?: string;
	// TODO with area? you get a TS error but without it lets null through (see web console).
	area: number;
	defaultGraphicUnit: number;
	areaUnit: AreaUnitType;
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
	byGroupID: {
		[groupID: number]: GroupDefinition;
	};
	selectedGroups: number[];
	// TODO groupInEditing: GroupDefinition & StatefulEditable | StatefulEditable;
	displayMode: DisplayMode;
}
