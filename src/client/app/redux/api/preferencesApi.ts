import { updateSelectedLanguage } from '../../actions/options';
import { graphSlice } from '../../reducers/graph';
import { PreferenceRequestItem } from '../../types/items';
import { RootState } from './../../store';
import { baseApi } from './baseApi';


export const preferencesApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getPreferences: builder.query<PreferenceRequestItem, void>({
			query: () => 'api/preferences',
			// Tags used for invalidation by mutation requests.
			onQueryStarted: async (_arg, { queryFulfilled, getState, dispatch }) => {
				try {
					const response = await queryFulfilled
					const state = getState() as RootState
					if (!state.graph.hotlinked) {
						dispatch(graphSlice.actions.changeChartToRender(response.data.defaultChartToRender));
						dispatch(graphSlice.actions.setBarStacking(response.data.defaultBarStacking));
						dispatch(graphSlice.actions.setAreaNormalization(response.data.defaultAreaNormalization));
						dispatch(updateSelectedLanguage(response.data.defaultLanguage));
					}

				} catch (e) {
					console.log('error', e)
				}

			}
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

