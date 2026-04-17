/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState } from 'store';
import { WeatherDataReading } from 'types/redux/weather';
import { baseApi } from './baseApi';

export const weatherDataAdapter = createEntityAdapter<WeatherDataReading>();
export const weatherDataInitialState = weatherDataAdapter.getInitialState();
export type WeatherDataState = EntityState<WeatherDataReading, number>;

export const weatherDataApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getWeatherData: builder.query<WeatherDataState, { id: number; startTime: string; endTime: string }>({
			query: ({ id, startTime, endTime }) => ({
				url: `api/weatherData/${id}`,
				params: { startTime, endTime }
			}),
			transformResponse: (response: WeatherDataReading[]) => {
				return weatherDataAdapter.setAll(weatherDataInitialState, response);
			},
			providesTags: ['WeatherData']
		})
	})
});

export const {
	useGetWeatherDataQuery
} = weatherDataApi;

export const selectWeatherDataResult = (id: number, startTime: string, endTime: string) =>
	weatherDataApi.endpoints.getWeatherData.select({ id, startTime, endTime });

export const {
	selectAll: selectAllWeatherData,
	selectById: selectWeatherDataById,
	selectTotal: selectWeatherDataTotal,
	selectIds: selectWeatherDataIds,
	selectEntities: selectWeatherDataEntities
} = weatherDataAdapter.getSelectors((state: RootState) =>
	selectWeatherDataResult(0, '', '')(state).data ?? weatherDataInitialState);