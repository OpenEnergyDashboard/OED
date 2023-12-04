/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { versionApi } from '../utils/api';
import { Thunk, ActionType, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/version';

/**
 * Request version action
 */
export function requestVersion(): t.RequestVersion {
	return { type: ActionType.RequestVersion };
}

/**
 * Receive version action
 * @param data Received version
 */
export function receiveVersion(data: string): t.ReceiveVersion {
	return { type: ActionType.ReceiveVersion, data };
}

/**
 * @param state The redux state.
 * @returns Whether preferences are fetching or already exist in state
 */
function shouldFetchVersion(state: State): boolean {
	return !state.version.isFetching && !state.version.version;
}

/**
 * Dispatches version fetch actions
 */
export function fetchVersion(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestVersion());
		// Returns the version string
		const version = await versionApi.getVersion();
		return dispatch(receiveVersion(version));
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

