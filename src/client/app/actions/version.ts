/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { versionApi } from '../utils/api';
import { Thunk, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { versionSlice } from '../reducers/version';


/**
 * @param state The redux state.
 * @returns Whether preferences are fetching
 */
function shouldFetchVersion(state: State): boolean {
	return !state.version.isFetching;
}

/**
 * Dispatches version fetch actions
 */
export function fetchVersion(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(versionSlice.actions.requestVersion());
		// Returns the version string
		const version = await versionApi.getVersion();
		return dispatch(versionSlice.actions.receiveVersion(version));
	};
}

/**
 * Function that performs the API call to retrieve the current version of the app,
 * and dispatches the corresponding action types.
 * This function will be called on component initialization.
 */
export function fetchVersionIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchVersion(getState())) {
			return dispatch(fetchVersion());
		}
		return Promise.resolve();
	};
}

