/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import * as t from '../types/redux/ciks'
import { ciksApi } from '../utils/api';

export function requestCiksDetails(): t.RequestCiksDetailsAction {
	return { type: ActionType.RequestCiksDetails };
}

export function receiveCiksDetails(data: t.CikData[]): t.ReceiveCiksDetailsAction {
	return { type: ActionType.ReceiveCiksDetails, data };
}

export function confirmCiksFetchedOnce(): t.ConfirmCiksFetchedOneAction {
	return { type: ActionType.ConfirmCiksFetchedOne };
}

export function fetchCiksData(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		if (!getState().ciks.isFetching) {
			dispatch(requestCiksDetails());
			const ciks = await ciksApi.getCiksDetails();
			dispatch(receiveCiksDetails(ciks));
			if (!getState().ciks.hasBeenFetchedOne) {
				dispatch(confirmCiksFetchedOnce());
			}
		}
	}
}

export function fetchCiksIfNeeded(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		if (!getState().ciks.hasBeenFetchedOne) {
			dispatch(fetchCiksData());
		}

		return Promise.resolve();
	}
}