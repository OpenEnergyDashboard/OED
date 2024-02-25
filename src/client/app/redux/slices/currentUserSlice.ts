/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { UserRole } from '../../types/items';
import { CurrentUserState } from '../../types/redux/currentUser';
import { setToken } from '../../utils/token';

/*
* Defines store interactions when version related actions are dispatched to the store.
*/
const defaultState: CurrentUserState = {
	profile: null,
	token: null
};

export const currentUserSlice = createSlice({
	name: 'currentUser',
	initialState: defaultState,
	reducers: {
		clearCurrentUser: state => {
			state.profile = null;
			state.token = null;
		},
		setUserToken: (state, action: PayloadAction<string | null>) => {
			state.token = action.payload;
		}
	},
	extraReducers: builder => {
		// Extra Reducers that listen for actions or endpoints and execute accordingly to update this slice's state.
		builder
			.addMatcher(userApi.endpoints.getUserDetails.matchFulfilled,
				(state, { payload }) => {
					state.profile = payload;
				})
			.addMatcher(authApi.endpoints.login.matchFulfilled,
				(state, { payload }) => {
					// User has logged in update state, and write to local storage
					state.profile = { email: payload.email, role: payload.role };
					state.token = payload.token;
					setToken(state.token);
				});
	},
	selectors: {
		selectCurrentUser: state => state,
		selectCurrentUserRole: state => state.profile?.role,
		// Should resolve to a boolean, Typescript doesn't agree so type assertion 'as boolean'
		selectIsAdmin: state => Boolean(state.token && state.profile?.role === UserRole.ADMIN),
		selectHasRolePermissions: (state, role: UserRole): boolean => {
			const isAdmin = currentUserSlice.getSelectors().selectIsAdmin(state);
			const userRole = currentUserSlice.getSelectors().selectCurrentUserRole(state);
			return Boolean(isAdmin || (userRole && userRole === role));

		}
	}
});

export const {
	selectCurrentUser,
	selectCurrentUserRole,
	selectIsAdmin,
	selectHasRolePermissions
} = currentUserSlice.selectors;

export const {
	setUserToken,
	clearCurrentUser
} = currentUserSlice.actions;