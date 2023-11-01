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
	id: number;
	name: string;
	childMeters: number[];
	childGroups: number[];
	deepMeters: number[];
	gps: GPSPoint | null;
	displayable: boolean;
	note?: string;
	// TODO with area? you get a TS error but without it lets null through (see web console).
	area: number;
	defaultGraphicUnit: number;
	areaUnit: AreaUnitType;
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


export interface StatefulEditable {
	dirty: boolean;
	submitted?: boolean;
}
export interface GroupDataByID {
	[groupID: number]: GroupData;

}
export interface GroupsState {
	byGroupID: GroupDataByID
	selectedGroups: number[];
}
