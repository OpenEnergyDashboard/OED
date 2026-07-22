/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { Holiday } from '../../types/redux/holidays';
import { baseApi } from './baseApi';

/*
 * Read-only endpoints for the `holidays` table (base holidays fetched from the
 * external API via Rose's page). The HolidayInstancePage only reads holidays;
 * add/edit/delete endpoints belong to Rose's page and can be injected here
 * when her page is wired up.
 */
export const holidaysApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getHolidays: builder.query<Holiday[], void>({
			query: () => 'api/holidays',
			providesTags: result =>
				result
					? [...result.map(({ id }) => ({ type: 'Holidays' as const, id })), { type: 'Holidays', id: 'LIST' }]
					: [{ type: 'Holidays', id: 'LIST' }]
		}),
		getHolidayById: builder.query<Holiday, number>({
			query: id => `api/holidays/${id}`,
			providesTags: (result, error, id) => [{ type: 'Holidays', id }]
		})
	})
});

export const selectHolidaysQueryState = holidaysApi.endpoints.getHolidays.select();
export const selectAllHolidays = createSelector(
	selectHolidaysQueryState,
	({ data: holidays = [] }) => holidays
);

export const stableEmptyHolidays: Holiday[] = [];

export const {
	useGetHolidaysQuery,
	useGetHolidayByIdQuery
} = holidaysApi;
