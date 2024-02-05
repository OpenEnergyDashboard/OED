/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { NewUser, User } from '../../types/items';
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
		createUser: builder.mutation<void, NewUser>({
			query: user => ({
				url: 'api/users/create',
				method: 'POST',
				body: { ...user }
			}),
			invalidatesTags: ['Users']
		}),
		editUsers: builder.mutation<void, User[]>({
			query: users => ({
				url: 'api/users/edit',
				method: 'POST',
				body: { users }
			}),
			invalidatesTags: ['Users']
		}),
		deleteUsers: builder.mutation<void, string>({
			query: email => ({
				url: 'api/users/delete',
				method: 'POST',
				body: { email }
			}),
			invalidatesTags: ['Users']
		})
	})
})