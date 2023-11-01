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

