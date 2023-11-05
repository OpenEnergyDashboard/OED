import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from '../../store';
// TODO Should be env variable?
const baseHref = (document.getElementsByTagName('base')[0] || {}).href;

export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: baseHref,
		prepareHeaders: (headers, { getState }) => {
			const state = getState() as RootState;
			// For each api call attempt to set the JWT token in the request header
			// Token placed in store either on startup after validation, or via credentialed login
			if (state.currentUser.token) {
				headers.set('token', state.currentUser.token)
			}
		}
	}),
	// The types of tags that any injected endpoint may, provide, or invalidate.
	// Must be defined here, for use in injected endpoints
	tagTypes: [
		'MeterData',
		'GroupData',
		'GroupChildrenData',
		'Preferences',
		'Users',
		'ConversionDetails'
	],
	// Initially no defined endpoints, Use rtk query's injectEndpoints
	endpoints: () => ({})
	// Defaults to 60 seconds or 1 minute
	// keepUnusedDataFor: 60
})