/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { omit, difference } from 'lodash';
import {
	BarReadingApiArgs,
	CompareReadingApiArgs,
	LineReadingApiArgs,
	RadarReadingApiArgs,
	ThreeDReadingApiArgs
} from '../selectors/chartQuerySelectors';
import { RootState } from '../../store';
import { BarReadings, CompareReadings, LineReadings, ThreeDReading } from '../../types/readings';
import { baseApi } from './baseApi';

export const readingsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		threeD: builder.query<ThreeDReading, ThreeDReadingApiArgs>({
			// ThreeD requests only single meters at a time which plays well with default cache behavior
			// No other properties are necessary for this endpoint
			// Refer to the line endpoint for an example of an endpoint with custom cache behavior
			query: ({ id, timeInterval, graphicUnitId, readingInterval, meterOrGroup }) => ({
				// destructure args that are passed into the callback, and generate/ implicitly return the API url for the request.
				url: `api/unitReadings/threeD/${meterOrGroup}/${id}`,
				params: { timeInterval, graphicUnitId, readingInterval }
			}),
			providesTags: ['Readings']
		}),
		line: builder.query<LineReadings, LineReadingApiArgs>({
			// Customize Cache Behavior by utilizing (serializeQueryArgs, merge, forceRefetch)
			serializeQueryArgs: ({ queryArgs }) => {
				// Modify the default serialization behavior to better suit our use case, and avoid querying already cached data.
				// We omit the ids so that any query with the same timeInterval, graphicUnitId, and meterOrGroup will hit the same cache
				// if we didn't omit id's there would be separate cache entries for queries with ids [1], [1,2], [1,2,3], [1,3], etc..
				// an entry for each means requesting the same data again for ALL meters. which results in too much duplicate data requests

				// We keep all args other than the ids.
				return omit(queryArgs, 'ids');
			},
			merge: (currentCacheData, responseData) => {
				// By default subsequent queries that resolve to the same cache entry will overwrite the existing data.
				// For our use case, many queries will point to the same resolved cache, therefore we must provide merge behavior to not lose data

				// it is important to note,
				// Since this is wrapped with Immer, you may either mutate the currentCacheValue directly, or return a new value, but not both at once.

				// mutate current cache draft
				Object.assign(currentCacheData, responseData);
			},
			forceRefetch: ({ currentArg, endpointState }) => {
				// Since we modified the way the we serialize the args any subsequent query would return the cache data, even if new meters were requested
				// To resolve this we provide a forceRefetch where we decide if data needs to be fetched, or retrieved from the cache.

				// get existing cached Keys if any
				const currentData = endpointState?.data ? Object.keys(endpointState.data).map(Number) : [];

				// check if the ALL requested id's already exist in cache
				const dataInCache = currentArg?.ids.every(id => currentData.includes(id));

				// if data requested already lives in the cache, no fetch necessary, else fetch for data
				return !dataInCache;
			},
			queryFn: async (args, queryApi, _extra, baseQuery) => {
				// We opt for a query function here instead of the normal query: args => {....}
				// In a queryFn, we can reference the store's state, to manipulate the provided query args
				// The query can request multiple ids, but we may already have some data cached, so only request the necessary ids.

				// use the query api to get the store's state, (Type Assertion necessary for typescript otherwise, 'unknown')
				const state = queryApi.getState() as RootState;
				// get cache data utilizing the readings Api endpoint
				// Refer to: https://redux-toolkit.js.org/rtk-query/api/created-api/endpoints#select
				const cachedData = readingsApi.endpoints.line.select(args)(state).data;
				// map cache keys to a number array, if any
				const cachedIDs = cachedData ? Object.keys(cachedData).map(Number) : [];
				// get the args provided in the original request
				const { ids, timeInterval, graphicUnitId, meterOrGroup } = args;
				// subtract any already cached keys from the requested ids, and stringify the array for the url endpoint
				const idsToFetch = difference(ids, cachedIDs).join(',');


				// use the baseQuery from the queryFn with our url endpoint
				const { data, error } = await baseQuery({
					// api url from derived request arguments
					url: `api/unitReadings/line/${meterOrGroup}/${idsToFetch}`,
					params: { timeInterval, graphicUnitId }
				});

				// https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#implementing-a-queryfn
				// queryFn requires either a data, or error object to be returned
				return error ? { error } : { data: data as LineReadings };
			},
			providesTags: ['Readings']
		}),
		bar: builder.query<BarReadings, BarReadingApiArgs>({
			// Refer to line endpoint for detailed explanation as the logic is identical
			serializeQueryArgs: ({ queryArgs }) => omit(queryArgs, 'ids'),
			merge: (currentCacheData, responseData) => { Object.assign(currentCacheData, responseData); },
			forceRefetch: ({ currentArg, endpointState }) => {
				const currentData = endpointState?.data ? Object.keys(endpointState.data).map(Number) : [];
				const dataInCache = currentArg?.ids.every(id => currentData.includes(id));
				return !dataInCache;
			},
			queryFn: async (args, queryApi, _extra, baseQuery) => {
				const { ids, meterOrGroup, ...params } = args;
				const state = queryApi.getState() as RootState;
				const cachedData = readingsApi.endpoints.bar.select(args)(state).data;
				const cachedIDs = cachedData ? Object.keys(cachedData).map(Number) : [];
				const idsToFetch = difference(ids, cachedIDs).join(',');
				const { data, error } = await baseQuery({ url: `api/unitReadings/bar/${meterOrGroup}/${idsToFetch}`, params });
				return error ? { error } : { data: data as BarReadings };
			},
			providesTags: ['Readings']
		}),
		compare: builder.query<CompareReadings, CompareReadingApiArgs>({
			serializeQueryArgs: ({ queryArgs }) => omit(queryArgs, 'ids'),
			merge: (currentCacheData, responseData) => { Object.assign(currentCacheData, responseData); },
			forceRefetch: ({ currentArg, endpointState }) => {
				const currentData = endpointState?.data ? Object.keys(endpointState.data).map(Number) : [];
				const requestedAlreadyCached = currentArg?.ids.every(id => currentData.includes(id));
				return !requestedAlreadyCached;
			},
			queryFn: async (args, queryApi, _extra, baseQuery) => {
				const { ids, meterOrGroup, ...params } = args;
				const state = queryApi.getState() as RootState;
				const cachedData = readingsApi.endpoints.compare.select(args)(state).data;
				const cachedIDs = cachedData ? Object.keys(cachedData).map(Number) : [];
				const idsToFetch = difference(ids, cachedIDs).join(',');
				const { data, error } = await baseQuery({ url: `/api/compareReadings/${meterOrGroup}/${idsToFetch}`, params });
				return error ? { error } : { data: data as CompareReadings };
			},
			providesTags: ['Readings']
		}),
		radar: builder.query<LineReadings, RadarReadingApiArgs>({
			// Refer to line endpoint for detailed explanation as the logic is identical
			serializeQueryArgs: ({ queryArgs }) => omit(queryArgs, 'ids'),
			merge: (currentCacheData, responseData) => { Object.assign(currentCacheData, responseData); },
			forceRefetch: ({ currentArg, endpointState }) => {
				const currentData = endpointState?.data ? Object.keys(endpointState.data).map(Number) : [];
				const dataInCache = currentArg?.ids.every(id => currentData.includes(id));
				return !dataInCache;
			},
			queryFn: async (args, queryApi, _extra, baseQuery) => {
				const { ids, meterOrGroup, ...params } = args;
				const state = queryApi.getState() as RootState;
				const cachedData = readingsApi.endpoints.radar.select(args)(state).data;
				const cachedIDs = cachedData ? Object.keys(cachedData).map(Number) : [];
				const idsToFetch = difference(ids, cachedIDs).join(',');
				const { data, error } = await baseQuery({ url: `api/unitReadings/radar/${meterOrGroup}/${idsToFetch}`, params });
				return error ? { error } : { data: data as LineReadings };
			},
			providesTags: ['Readings']
		})

	})
});

// Stable reference for when there is not data. Avoids rerenders.
export const stableEmptyLineReadings: LineReadings = {};
export const stableEmptyBarReadings: BarReadings = {};
export const stableEmptyThreeDReadings: ThreeDReading = {
	xData: [],
	yData: [],
	zData: []
};
