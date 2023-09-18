import { baseApi } from './baseApi'
import { GroupData } from '../../types/redux/groups'

export const groupsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getGroups: builder.query<GroupData[], void>({ query: () => 'api/groups' })
	})
})

export const selectGroupInfo = groupsApi.endpoints.getGroups.select();