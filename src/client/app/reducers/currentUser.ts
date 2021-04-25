/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { CurrentUserAction, CurrentUserState } from '../types/redux/currentUser';
import { ActionType } from '../types/redux/actions';

/*
* Defines store interactions when version related actions are dispatched to the store.
*/
const defaultState: CurrentUserState = { isFetching: false, profile: null  };

export default function profile(state = defaultState, action: CurrentUserAction): CurrentUserState {
	switch (action.type) {
		case ActionType.RequestCurrentUser:
			// When the current user's profile is requested, indicate app is fetching data from API
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveCurrentUser:
			// When the current user's profile is received, update the store with result from API
			return {
				...state,
				isFetching: false,
				profile: action.data
			};
		case ActionType.ClearCurrentUser:
			// Removes the current user from the redux store.
			return {
				...state,
				profile: null
			}
		default:
			return state;
	}
}
