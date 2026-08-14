/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { CreateHolidayInstancePayload, HolidayInstance, HolidayInstanceDetails } from '../../types/redux/holidays';
import { baseApi } from './baseApi';

/*
 * Endpoints for the `holiday_instance` table ("Holiday Rates" in the UI).
 * All mutations are POST per the server's route conventions; the edit route
 * requires holidayId even when it is unchanged. Mutations invalidate the
 * HolidayInstances tags so the list refetches from the server.
 * TODO: before delete, check group membership in Redux state and block with
 * a friendly message instead of surfacing the foreign-key database error.
 */
export const holidayInstancesApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getHolidayInstances: builder.query<HolidayInstance[], void>({
			query: () => 'api/holidayInstances',
			providesTags: result =>
				result
					? [...result.map(({ id }) => ({ type: 'HolidayInstances' as const, id })), { type: 'HolidayInstances', id: 'LIST' }]
					: [{ type: 'HolidayInstances', id: 'LIST' }]
		}),
		// Joined with holiday + day pattern names; useful for the instance cards.
		getHolidayInstancesWithDetails: builder.query<HolidayInstanceDetails[], void>({
			query: () => 'api/holidayInstances/withDetails',
			providesTags: result =>
				result
					? [...result.map(({ id }) => ({ type: 'HolidayInstances' as const, id })), { type: 'HolidayInstances', id: 'LIST' }]
					: [{ type: 'HolidayInstances', id: 'LIST' }]
		}),
		addHolidayInstance: builder.mutation<HolidayInstance, CreateHolidayInstancePayload>({
			query: holidayInstance => ({
				url: 'api/holidayInstances/addHolidayInstance',
				method: 'POST',
				body: holidayInstance
			}),
			transformErrorResponse: res => res.data,
			// Invalidate the list so the cards refetch from the server — global
			// state is never written from the local copy.
			invalidatesTags: [{ type: 'HolidayInstances', id: 'LIST' }]
		}),
		editHolidayInstance: builder.mutation<void, HolidayInstance>({
			query: holidayInstance => ({
				url: 'api/holidayInstances/edit',
				method: 'POST',
				body: holidayInstance
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'HolidayInstances', id: arg.id }, { type: 'HolidayInstances', id: 'LIST' }]
		}),
		deleteHolidayInstance: builder.mutation<void, Pick<HolidayInstance, 'id'>>({
			query: ({ id }) => ({
				url: 'api/holidayInstances/delete',
				method: 'POST',
				body: { id }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: [{ type: 'HolidayInstances', id: 'LIST' }]
		})
	})
});

export const selectHolidayInstancesQueryState = holidayInstancesApi.endpoints.getHolidayInstances.select();
export const selectAllHolidayInstances = createSelector(
	selectHolidayInstancesQueryState,
	({ data: holidayInstances = [] }) => holidayInstances
);

export const stableEmptyHolidayInstances: HolidayInstance[] = [];

export const {
	useGetHolidayInstancesQuery,
	useGetHolidayInstancesWithDetailsQuery,
	useAddHolidayInstanceMutation,
	useEditHolidayInstanceMutation,
	useDeleteHolidayInstanceMutation
} = holidayInstancesApi;
