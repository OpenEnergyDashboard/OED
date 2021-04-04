/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';
import { NamedIDItem } from '../items';
import {GPSPoint} from '../../utils/calibration';

export interface RequestMetersDetailsAction {
	type: ActionType.RequestMetersDetails;
}

export interface ReceiveMetersDetailsAction {
	type: ActionType.ReceiveMetersDetails;
	data: NamedIDItem[];
}

export interface ChangeDisplayedMetersAction {
	type: ActionType.ChangeDisplayedMeters;
	selectedMeters: number[];
}

export interface EditMeterDetailsAction {
	type: ActionType.EditMeterDetails;
	meter: MeterMetadata;
}

export interface SubmitEditedMeterAction {
	type: ActionType.SubmitEditedMeter;
	meter: number;
}

export interface ConfirmEditedMeterAction {
	type: ActionType.ConfirmEditedMeter;
	meter: number;
}

export type MetersAction =
		| RequestMetersDetailsAction
		| ReceiveMetersDetailsAction
		| ChangeDisplayedMetersAction
		| EditMeterDetailsAction
		| SubmitEditedMeterAction
		| ConfirmEditedMeterAction;

export interface MeterMetadata {
	id: number;
	name: string;
	identifier: string;
	enabled: boolean;
	displayable: boolean;
	meterType?: string;
	ipAddress?: string;
	timeZone?: string;
	gps?: GPSPoint;
}

export interface MeterMetadataByID {
	[meterID: number]: MeterMetadata;
}

export interface MeterEditData {
	id: number;
	enabled: boolean;
	displayable: boolean;
	gps: GPSPoint;
	identifier: string;
}

export interface MetersState {
	isFetching: boolean;
	byMeterID: MeterMetadataByID;
	selectedMeters: number[];
	// Holds all meters that have been edited locally
	editedMeters: MeterMetadataByID;
	// Meters the app is currently attempting to upload meter changes
	submitting: number[];
}
