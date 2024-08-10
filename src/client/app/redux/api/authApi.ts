/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { currentUserSlice } from '../slices/currentUserSlice';
import { User } from '../../types/items';
import { deleteToken, getToken, hasToken } from '../../utils/token';
import { baseApi } from './baseApi';

type LoginResponse = User & {
	token: string
};

export const authApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		login: builder.mutation<LoginResponse, { username: string, password: string }>({
			query: loginArgs => ({
				url: 'api/login',
				method: 'POST',
				body: loginArgs
			}),
			// When this mutation is successful, cache stores with these tags are marked as invalid
			// next time the corresponding endpoint is queried, cache will be ignored and overwritten by a fresh query.
			// in this case, a user logged in which means that some info for ADMIN meters groups etc.
			// invalidate forces a refetch to any subscribed components or the next query.
			invalidatesTags: ['MeterData', 'GroupData']
		}),
		verifyToken: builder.mutation<{ success: boolean }, string>({
			query: token => ({
				url: 'api/verification',
				method: 'POST',
				body: { token: token }
			})
		}),
		tokenPoll: builder.query<null, void>({
			// Query to be used as a polling utility for admin outlet pages.
			queryFn: (_args, api) => {
				if (hasToken()) {
					api.dispatch(authApi.endpoints.verifyToken.initiate(getToken()));
				}
				// don't care about data, middleware will handle failed verifications
				return { data: null };
			}
		}),
		logout: builder.mutation<null, void>({
			queryFn: (_, { dispatch }) => {
				// Opt to use a RTK mutation instead of manually writing a thunk to take advantage mutation invalidations
				deleteToken();
				dispatch(currentUserSlice.actions.clearCurrentUser());
				return { data: null };
			},
			invalidatesTags: ['MeterData', 'GroupData']
		})
	})
});

// Poll interval in milliseconds (1 minute)
export const authPollInterval = 60000;