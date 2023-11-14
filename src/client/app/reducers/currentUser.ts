/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../redux/api/authApi';
import { userApi } from '../redux/api/userApi';
import { User, UserRole } from '../types/items';
import { CurrentUserState } from '../types/redux/currentUser';
import { setToken } from '../utils/token';

/*
* Defines store interactions when version related actions are dispatched to the store.
*/
const defaultState: CurrentUserState = {
	isFetching: false,
	profile: null,
	token: null
};

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
		},
		setUserToken: (state, action: PayloadAction<string | null>) => {
			state.token = action.payload
		}
	},
	extraReducers: builder => {
		// Extra Reducers that listen for actions or endpoints and execute accordingly to update this slice's state.
		builder
			.addMatcher(userApi.endpoints.getUserDetails.matchFulfilled,
				(state, { payload }) => {
					state.profile = payload
				})
			.addMatcher(authApi.endpoints.login.matchFulfilled,
				(state, { payload }) => {
					// User has logged in update state, and write to local storage
					state.profile = { email: payload.email, role: payload.role }
					state.token = payload.token
					setToken(state.token)
				})
	},
	selectors: {
		selectCurrentUser: state => state,
		selectCurrentUserRole: state => state.profile?.role,
		selectIsAdmin: state => Boolean(state.token && state.profile?.role === UserRole.ADMIN)
		// Should resolve to a boolean, Typescript doesn't agree so type assertion 'as boolean'
	}
})

export const {
	selectCurrentUser,
	selectCurrentUserRole,
	selectIsAdmin
} = currentUserSlice.selectors
