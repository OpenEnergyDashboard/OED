/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../../store';

export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		prepareHeaders: (headers, { getState }) => {
			const state = getState() as RootState;
			// For each api call attempt to set the JWT token in the request header
			// Token placed in store either on startup after validation, or via credentialed login
			if (state.currentUser.token) {
				headers.set('token', state.currentUser.token);
			}
		},
		// Default Behavior assumes all responses are json
		// use content type because API responses are varied
		responseHandler: 'content-type'
	}),
	// The types of tags that any injected endpoint may, provide, or invalidate.
	// Must be defined here, for use in injected endpoints
	tagTypes: [
		'MapsData',
		'MeterData',
		'GroupData',
		'GroupChildrenData',
		'Preferences',
		'Users',
		'ConversionDetails',
		'Units',
		'Cik',
		'Readings'
	],
	// Initially no defined endpoints, Use rtk query's injectEndpoints
	endpoints: () => ({})
});
