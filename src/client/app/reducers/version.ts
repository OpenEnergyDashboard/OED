/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { VersionAction, VersionState } from '../types/redux/version';
import { ActionType } from '../types/redux/actions';

/*
* Defines store interactions when user profile related actions are dispatched to the store.
*/
const defaultState: VersionState = { isFetching: false, version: '' };

export default function version(state = defaultState, action: VersionAction) {
	switch (action.type) {
		case ActionType.RequestVersion:
			// When version is requested, indicate app is fetching data from API
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveVersion:
			// When version is received, update the store with result from API
			return {
				...state,
				isFetching: false,
				version: action.data
			};
		default:
			return state;
	}
}