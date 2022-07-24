/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TimeZones } from 'types/timezone';
import { GPSPoint } from 'utils/calibration';
import { ActionType } from './actions';

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
	editedMeter: MeterData;
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
| DeleteSubmittedMeterAction
| SubmitEditedMeterAction
| ConfirmMetersFetchedOnceAction;

export enum MeterType {
	mamac = 'mamac',
	metasys = 'metasys',
	obvius = 'obvius',
	other = 'other'
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
	timeZone: TimeZones;
	gps: GPSPoint;
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
	timeSort: boolean;
	startTimestamp: string;
	endTimestamp: string;
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
	timeZone: TimeZones;
	gps: GPSPoint;
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
	timeSort: boolean;
	startTimestamp: string;
	endTimestamp: string;
}

export interface MeterDataByID {
	[meterID: number]: MeterData;
}

export interface MetersState {
	hasBeenFetchedOnce: boolean;
	isFetching: boolean;
	selectedMeters: number[];
	submitting: number[];
	byMeterID: MeterDataByID; // @TODO remove when updated, does the same as meters state
	meters: MeterDataByID;
}