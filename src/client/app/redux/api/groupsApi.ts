import { baseApi } from './baseApi'
import { GroupChildren, GroupDetailsData } from '../../types/redux/groups'

export const groupsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getGroups: builder.query<GroupDetailsData[], void>({
			query: () => 'api/groups',
			providesTags: ['GroupData']
		}),
		getAllGroupsChildren: builder.query<GroupChildren[], void>({
			query: () => 'api/groups/allChildren',
			providesTags: ['GroupChildrenData']
		})
	})
})

export const selectGroupInfo = groupsApi.endpoints.getGroups.select();