/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { CurrentUserState } from '../types/redux/currentUser';
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { User } from '../types/items';


/*
* Defines store interactions when version related actions are dispatched to the store.
*/
const defaultState: CurrentUserState = { isFetching: false, profile: null };

export const currentUserSlice = createSlice({
	name: 'currentUser',
	initialState: defaultState,
	reducers: {
		requestCurrentUser: state => {
			state.isFetching = true
		},
		receiveCurrentUser: (state, action: PayloadAction<User>) => {
			state.isFetching = false
			state.profile = action.payload
		},
		clearCurrentUser: state => {
			state.profile = null
		}
	}
})
// export default function profile(state = defaultState, action: CurrentUserAction): CurrentUserState {
// 	switch (action.type) {
// 		case ActionType.RequestCurrentUser:
// 			// When the current user's profile is requested, indicate app is fetching data from API
// 			return {
// 				...state,
// 				isFetching: true
// 			};
// 		case ActionType.ReceiveCurrentUser:
// 			// When the current user's profile is received, update the store with result from API
// 			return {
// 				...state,
// 				isFetching: false,
// 				profile: action.data
// 			};
// 		case ActionType.ClearCurrentUser:
// 			// Removes the current user from the redux store.
// 			return {
// 				...state,
// 				profile: null
// 			}
// 		default:
// 			return state;
// 	}
// }