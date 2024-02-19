/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

export interface RequestCiksDetailsAction {
	type: ActionType.RequestCiksDetails;
}

export interface ReceiveCiksDetailsAction {
	type: ActionType.ReceiveCiksDetails;
	data: CikData[];
}

export interface ConfirmCiksFetchedOneAction {
	type: ActionType.ConfirmCiksFetchedOne;
}

export type CiksAction = RequestCiksDetailsAction
| ReceiveCiksDetailsAction
| ConfirmCiksFetchedOneAction;

export interface CikData {
	meterUnitId: number;
	nonMeterUnitId: number;
	slope: number;
	intercept: number;
}

export interface CiksState {
	hasBeenFetchedOne: boolean;
	isFetching: boolean;
	ciks: CikData[];
}
