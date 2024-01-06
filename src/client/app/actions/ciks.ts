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
		// make sure ciks is not being fetched
		if (!getState().ciks.isFetching) {
			// set isFetching to true
			dispatch(requestCiksDetails());
			// retrieve ciks data from database
			const ciks = await ciksApi.getCiksDetails();
			// update the state with the Cik details and set isFetching to false
			dispatch(receiveCiksDetails(ciks));
			// If this is the first fetch, inform the store that the first fetch has been made
			if (!getState().ciks.hasBeenFetchedOne) {
				dispatch(confirmCiksFetchedOnce());
			}
		}
	}
}

/**
 * Fetch the ciks details from the database if they have not already been fetched once
 */
export function fetchCiksIfNeeded(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// If ciks have not been fetched once, call the fetchCiksData
		if (!getState().ciks.hasBeenFetchedOne) {
			dispatch(fetchCiksData());
		}
		// If ciks have already been fetched, return a resolved promise
		return Promise.resolve();
	}
}