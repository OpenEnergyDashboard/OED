/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

export interface RequestUnitsDetailsAction {
	type: ActionType.RequestUnitsDetails;
}

export interface ReceiveUnitsDetailsAction {
	type: ActionType.ReceiveUnitsDetails;
	data: UnitData[];
}

export interface ChangeDisplayedUnitsAction {
	type: ActionType.ChangeDisplayedUnits;
	selectedUnits: number[];
}

export interface EditUnitDetailsAction {
	type: ActionType.EditUnitDetails;
	unit: UnitData;
}

export interface ConfirmEditedUnitAction {
	type: ActionType.ConfirmEditedUnit;
	unit: number;
}

export interface SubmitEditedUnitAction {
	type: ActionType.SubmitEditedUnit;
	unit: number;
}

export interface ConfirmUnitsFetchedOnceAction {
	type: ActionType.ConfirmUnitsFetchedOnce;
}

export type UnitsAction = RequestUnitsDetailsAction
| ReceiveUnitsDetailsAction
| ChangeDisplayedUnitsAction
| EditUnitDetailsAction
| ConfirmEditedUnitAction
| SubmitEditedUnitAction
| ConfirmUnitsFetchedOnceAction;

export enum UnitType {
	unit = 'unit',
	meter = 'meter',
	suffix = 'suffix'
}

export enum DisplayableType {
	none = 'none',
	all = 'all',
	admin = 'admin'
}

export enum UnitRepresentType {
	quantity = 'quantity',
	flow = 'flow',
	raw = 'raw',
	unused = 'unused'
}

export interface UnitData {
	id: number;
	name: string;
	identifier: string;
	unitRepresent: UnitRepresentType;
	secInRate: number;
	typeOfUnit: UnitType;
	unitIndex: number;
	suffix: string;
	displayable: DisplayableType;
	preferredDisplay: boolean;
	note: string;
}

export interface UnitEditData {
	id: number;
	name: string;
	identifier: string;
	unitRepresent: string;
	secInRate: number;
	typeOfUnit: UnitType;
	unitIndex: number;
	suffix: string;
	displayable: DisplayableType;
	preferredDisplay: boolean;
	note: string;
}

export interface UnitDataById {
	[unitId: number]: UnitData;
}

export interface UnitsState {
	hasBeenFetchedOnce: boolean,
	isFetching: boolean;
	selectedUnits: number[];
	editedUnits: UnitDataById;
	submitting: number[];
	units: UnitDataById;
}
