import { createSelector } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export const versionApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getVersion: builder.query<string, void>({
			query: () => '/api/version'
		})
	})
})

export const selectVersion = versionApi.endpoints.getVersion.select()
export const selectOEDVersion = createSelector(
	selectVersion,
	({ data: version }) => {
		return version ?? ''
	}
)