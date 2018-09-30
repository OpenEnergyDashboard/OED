/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';
import { NamedIDItem } from '../items';

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

export type MetersAction =
		| RequestMetersDetailsAction
		| ReceiveMetersDetailsAction
		| ChangeDisplayedMetersAction;

export interface MeterMetadata {
	id: number;
	name: string;
	enabled: boolean;
	displayable: boolean;
	meterType?: string;
	ipAddress?: string;
}

export interface MetersState {
	isFetching: boolean;
	byMeterID: {
		[meterID: number]: MeterMetadata;
	};
	selectedMeters: number[];
}
