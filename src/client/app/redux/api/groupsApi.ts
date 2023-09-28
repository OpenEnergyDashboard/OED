import { baseApi } from './baseApi'
import { GroupDetailsData } from '../../types/redux/groups'

export const groupsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getGroups: builder.query<GroupDetailsData[], void>({
			query: () => 'api/groups',
			providesTags: ['GroupData']
		})
	})
})

export const selectGroupInfo = groupsApi.endpoints.getGroups.select();