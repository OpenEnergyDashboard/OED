/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { User } from '../../types/items';
import { baseApi } from './baseApi';

export const userApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getUserDetails: builder.query<User | null, void>({
			query: () => 'api/users/token',
			// Do not retain response when no subscribers
			keepUnusedDataFor: 0
		}),
		getUsers: builder.query<User[], void>({
			query: () => 'api/users',
			providesTags: ['Users']
		}),
		createUser: builder.mutation<void, User>({
			query: user => ({
				url: 'api/users/create',
				method: 'POST',
				body: { ...user }
			}),
			invalidatesTags: ['Users']
		}),
		editUser: builder.mutation<void, User>({
			query: user => ({
				url: 'api/users/edit',
				method: 'POST',
				body: { user }
			}),
			invalidatesTags: ['Users']
		}),
		deleteUsers: builder.mutation<void, string>({
			query: username => ({
				url: 'api/users/delete',
				method: 'POST',
				body: { username }
			}),
			invalidatesTags: ['Users']
		})
	})
});

// Provide a stable empty reference for when data is in flight
export const stableEmptyUsers: User[] = [];