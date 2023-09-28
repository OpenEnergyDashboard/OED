import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from '../../store';
// TODO Should be env variable
const baseHref = (document.getElementsByTagName('base')[0] || {}).href;

export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: baseHref,
		prepareHeaders: (headers, { getState }) => {
			// For each api call attempt to set the JWT token in the request header
			const state = getState() as RootState;
			if (state.currentUser.token) {
				headers.set('token', state.currentUser.token)
			}
		}
	}),
	tagTypes: ['MeterData', 'GroupData', 'Preferences'],
	// Initially no defined endpoints, Use rtk query's injectEndpoints
	endpoints: () => ({}),
	// Keep Data in Cache for 10 Minutes (600 seconds)
	keepUnusedDataFor: 600
})