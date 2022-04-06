/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/units';
import { unitsApi } from '../utils/api';

export function requestUnitsDetails(): t.RequestUnitsDetailsAction {
	return { type: ActionType.RequestUnitsDetails };
}

export function receiveUnitsDetails(data: t.UnitData[]): t.ReceiveUnitsDetailsAction {
	return { type: ActionType.ReceiveUnitsDetails, data };
}

export function fetchUnitsDetails(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestUnitsDetails());
		const units = await unitsApi.getUnitsDetails();
		dispatch(receiveUnitsDetails(units));
	}
}

function shouldFetchUnitsDetails(state: State): boolean {
	return !state.units.isFetching;
}

export function fetchUnitsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchUnitsDetails(getState())) {
			return dispatch(fetchUnitsDetails());
		}
		return Promise.resolve();
	};
}
