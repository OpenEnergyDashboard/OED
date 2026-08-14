/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import {
	Holiday,
	HolidayLocations,
	HolidayLocationsQuery,
	RefreshHolidaysRequest,
	RefreshHolidaysResponse
} from '../../types/redux/holidays';
import { baseApi } from './baseApi';

/*
 * Endpoints for reading saved holidays and importing holidays by location.
 * imported holidays are stored in the db before the list is refreshed.
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
		}),
		getHolidayLocations: builder.query<HolidayLocations, HolidayLocationsQuery>({
			query: locationQuery => {
				const params = new URLSearchParams();

				if (locationQuery.country) {
					params.set('country', locationQuery.country);
				}

				if (locationQuery.state) {
					params.set('state', locationQuery.state);
				}

				const queryString = params.toString();
				let url = 'api/holidays/locations';

				if (queryString.length > 0) {
					url += `?${queryString}`;
				}

				return url;
			}
		}),
		refreshHolidays: builder.mutation<RefreshHolidaysResponse, RefreshHolidaysRequest>({
			query: body => ({
				url: 'api/holidays/refresh',
				method: 'POST',
				body
			}),
			transformErrorResponse: response => response.data,
			invalidatesTags: [{ type: 'Holidays', id: 'LIST' }]
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
	useGetHolidayByIdQuery,
	useGetHolidayLocationsQuery,
	useRefreshHolidaysMutation
} = holidaysApi;