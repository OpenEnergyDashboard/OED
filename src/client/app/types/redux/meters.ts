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

export type MetersAction = RequestMetersDetailsAction | ReceiveMetersDetailsAction;

export interface MetersState {
	isFetching: boolean;
	byMeterID: {
		[meterID: number]: {
			id: number;
			name: string;
		};
	};
}
