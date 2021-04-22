/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ProfileAction, ProfileState } from '../types/redux/profile';
import { ActionType } from '../types/redux/actions';

/*
* Defines store interactions when version related actions are dispatched to the store.
*/
const defaultState: ProfileState = { isFetching: false, profile: null  };

export default function profile(state = defaultState, action: ProfileAction): ProfileState {
	switch (action.type) {
		case ActionType.RequestProfile:
			// When version is requested, indicate app is fetching data from API
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveProfile:
			// When version is received, update the store with result from API
			return {
				...state,
				isFetching: false,
				profile: action.data
			};
		default:
			return state;
	}
}
