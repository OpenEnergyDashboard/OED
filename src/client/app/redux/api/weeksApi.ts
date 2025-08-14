/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Week } from '../../types/redux/weeks';
import { baseApi } from './baseApi';

/**
 * This file defines the weeksApi using RTK Query.
 * It provides endpoints for fetching, adding, deleting, and editing weekly patterns.
 * The API is injected into the baseApi created in baseApi.ts.
 */
export const weeksApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getWeeks: builder.query<Week[], void>({
			query: () => 'api/weeks',
			// Provides a list of 'Weeks' by id.
			// If any mutation invalidates any of these tags, the query will refetch.
			// The 'LIST' tag is used to invalidate the entire list.
			providesTags: result =>
				result ?
					[...result.map(({ id }) => ({ type: 'Weeks', id }) as const), { type: 'Weeks', id: 'LIST' }] :
					[{ type: 'Weeks', id: 'LIST' }]
		}),

		addWeek: builder.mutation<void, Omit<Week, 'id'>>({
			query: week => ({
				url: 'api/weeks/addWeek',
				method: 'POST',
				body: week
			}),
			transformErrorResponse: res => res.data,
			// On successful addition, invalidates the 'Weeks' list to refetch it.
			invalidatesTags: (result, error) => !error ? [{ type: 'Weeks', id: 'LIST' }] : []
		}),

		deleteWeek: builder.mutation<void, Pick<Week, 'id'>>({
			query: weekId => ({
				url: 'api/weeks/delete',
				method: 'POST',
				body: weekId
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, weekId) => [{ type: 'Weeks', id: weekId.id }]
		}),

		editWeek: builder.mutation<void, Week>({
			query: week => ({
				url: 'api/weeks/edit',
				method: 'POST',
				body: week
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, week) => [{ type: 'Weeks', id: week.id }]
		})
	})
});
