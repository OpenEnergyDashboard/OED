/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PreferenceRequestItem } from '../../types/items';
import { baseApi } from './baseApi';


export const preferencesApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getPreferences: builder.query<PreferenceRequestItem, void>({
			query: () => 'api/preferences',
			providesTags: ['Preferences']
		}),
		submitPreferences: builder.mutation<PreferenceRequestItem, PreferenceRequestItem>({
			query: preferences => ({
				url: 'api/preferences',
				method: 'POST',
				body: { preferences }
			}),
			invalidatesTags: ['Preferences']
		})
	})
})
