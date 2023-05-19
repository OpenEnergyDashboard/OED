/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { GPSPoint } from 'utils/calibration';
import { ActionType } from './actions';
import { AreaUnitType } from 'utils/getAreaUnitConversion';

export interface RequestMetersDetailsAction {
	type: ActionType.RequestMetersDetails;
}

export interface ReceiveMetersDetailsAction {
	type: ActionType.ReceiveMetersDetails;
	data: MeterData[];
}

export interface ChangeDisplayedMetersAction {
	type: ActionType.ChangeDisplayedMeters;
	selectedMeters: number[];
}

export interface ConfirmEditedMeterAction {
	type: ActionType.ConfirmEditedMeter;
	editedMeter: MeterEditData;
}

export interface ConfirmAddMeterAction {
	type: ActionType.ConfirmAddMeter;
	addedMeter: MeterEditData;
}

export interface DeleteSubmittedMeterAction {
	type: ActionType.DeleteSubmittedMeter;
	meterId: number;
}

export interface SubmitEditedMeterAction {
	type: ActionType.SubmitEditedMeter;
	meterId: number;
}

export interface ConfirmMetersFetchedOnceAction {
	type: ActionType.ConfirmMetersFetchedOnce;
}

export type MetersAction = RequestMetersDetailsAction
| ReceiveMetersDetailsAction
| ChangeDisplayedMetersAction
| ConfirmEditedMeterAction
| ConfirmAddMeterAction
| DeleteSubmittedMeterAction
| SubmitEditedMeterAction
| ConfirmMetersFetchedOnceAction;

// The relates to the JS object Meter.types for the same use in src/server/models/Meter.js.
// They should be kept in sync.
export enum MeterType {
	EGAUGE = 'egauge',
	MAMAC = 'mamac',
	METASYS = 'metasys',
	OBVIUS = 'obvius',
	OTHER = 'other'
}

// This relates to TimeSortTypes in src/client/app/types/csvUploadForm.ts but does not have 'meter value or default'.
// They should be kept in sync.
export enum MeterTimeSortType {
	increasing = 'increasing',
	decreasing = 'decreasing',
}

export interface MeterData {
	id: number;
	identifier: string;
	name: string;
	area: number;
	enabled: boolean;
	displayable: boolean;
	meterType: string;
	url: string;
	timeZone: string;
	gps: GPSPoint | null;
	unitId: number;
	defaultGraphicUnit: number;
	note: string;
	cumulative: boolean;
	cumulativeReset: boolean;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	endOnlyTime: boolean;
	reading: number;
	readingGap: number;
	readingVariation: number;
	readingDuplication: number;
	timeSort: string;
	startTimestamp: string;
	endTimestamp: string;
	previousEnd: string;
	areaUnit: AreaUnitType;
	readingFrequency: string;
}

export interface MeterEditData {
	id: number;
	identifier: string;
	name: string;
	area: number;
	enabled: boolean;
	displayable: boolean;
	meterType: string;
	url: string;
	timeZone: string | null;
	gps: GPSPoint | null;
	unitId: number;
	defaultGraphicUnit: number;
	note: string;
	cumulative: boolean;
	cumulativeReset: boolean;
	cumulativeResetStart: string;
	cumulativeResetEnd: string;
	endOnlyTime: boolean;
	reading: number;
	readingGap: number;
	readingVariation: number;
	readingDuplication: number;
	timeSort: string;
	startTimestamp: string | undefined;
	endTimestamp: string | undefined;
	previousEnd: string | undefined;
	areaUnit: AreaUnitType;
	readingFrequency: string;
}

export interface MeterDataByID {
	[meterID: number]: MeterData;
}

export interface MetersState {
	hasBeenFetchedOnce: boolean;
	isFetching: boolean;
	selectedMeters: number[];
	submitting: number[];
	byMeterID: MeterDataByID;
}