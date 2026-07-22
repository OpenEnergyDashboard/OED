/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { CreateDayPayload, Day } from '../../types/redux/days';
import { baseApi } from './baseApi';

export const daysApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getDays: builder.query<Day[], void>({
			query: () => 'api/days',
			providesTags: result =>
				result
					? [...result.map(({ id }) => ({ type: 'Days' as const, id })), { type: 'Days', id: 'LIST' }]
					: [{ type: 'Days', id: 'LIST' }]
		}),
		getDayById: builder.query<Day, number>({
			query: id => `api/days/${id}`,
			providesTags: (result, error, id) => [{ type: 'Days', id }]
		}),
		addDay: builder.mutation<void, CreateDayPayload>({
			query: Day => ({
				url: 'api/days/addDay',
				method: 'POST',
				body: Day
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: ['Days']
		}),
		editDay: builder.mutation<void, Day>({
			query: Day => ({
				url: 'api/days/edit',
				method: 'POST',
				body: Day
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'Days', id: arg.id }]
		}),
		deleteDay: builder.mutation<void, Pick<Day, 'id'>>({
			query: ({ id }) => ({
				url: 'api/days/delete',
				method: 'POST',
				body: { id }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'Days', id: arg.id }]
		})
	})
});

export const selectDaysQueryState = daysApi.endpoints.getDays.select();
export const selectAllDays = createSelector(
	selectDaysQueryState,
	({ data: days = [] }) => days
);

export const stableEmptyDays: Day[] = [];

export const {
	useGetDaysQuery,
	useGetDayByIdQuery,
	useAddDayMutation,
	useEditDayMutation,
	useDeleteDayMutation
} = daysApi;
