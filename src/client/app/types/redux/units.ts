/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
	raw = 'raw'
}

export interface UnitData {
	id: number;
	name: string;
	identifier: string;
	unitRepresent: UnitRepresentType;
	secInRate: number;
	typeOfUnit: UnitType;
	suffix: string;
	displayable: DisplayableType;
	preferredDisplay: boolean;
	note: string;
	defaultMeterMinimumValue:number,
	defaultMeterMaximumValue:number
}

export interface UnitEditData {
	id: number;
	name: string;
	identifier: string;
	unitRepresent: string;
	secInRate: number;
	typeOfUnit: UnitType;
	suffix: string;
	displayable: DisplayableType;
	preferredDisplay: boolean;
	note: string;
}

export interface UnitDataById extends Record<number, UnitData> { }

export interface UnitsState {
	hasBeenFetchedOnce: boolean,
	isFetching: boolean;
	selectedUnits: number[];
	submitting: number[];
	units: UnitDataById;
}
