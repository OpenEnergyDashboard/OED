/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

export interface RequestConversionArrayAction {
	type: ActionType.RequestConversionArray;
}

export interface ReceiveConversionArrayAction {
	type: ActionType.ReceiveConversionArray;
	data: ConversionArrayRequestItem;
}

export type ConversionArrayAction = RequestConversionArrayAction | ReceiveConversionArrayAction;

/**
 * The item that a get sconversion array request returns.
 */
export interface ConversionArrayRequestItem {
	pikArray: (boolean)[][];
}

/**
 * The conversion array's state.
 */
export interface ConversionArrayState {
	isFetching: boolean;
	// The Pik array which is true if there is a conversion from row to column.
	pikArray: (boolean)[][];
}
