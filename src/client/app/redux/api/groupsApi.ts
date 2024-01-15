/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EntityState, Update, createEntityAdapter } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { selectIsAdmin } from '../slices/currentUserSlice';
import { RootState } from '../../store';
import { GroupChildren, GroupData } from '../../types/redux/groups';
import { baseApi } from './baseApi';
export const groupsAdapter = createEntityAdapter<GroupData>({
	sortComparer: (groupA, groupB) => groupA.name?.localeCompare(groupB.name, undefined, { sensitivity: 'accent' })
})
export const groupsInitialState = groupsAdapter.getInitialState()
export type GroupDataState = EntityState<GroupData, number>

export const groupsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getGroups: builder.query<GroupDataState, void>({
			query: () => 'api/groups',
			transformResponse: (response: GroupData[]) => {
				return groupsAdapter.setAll(
					groupsInitialState,
					response.map(groupData => ({
						...groupData,
						// endpoint doesn't return these so define them here or else undefined may cause issues on admin pages
						childMeters: [],
						childGroups: []
					})))
			},
			onQueryStarted: async (_, { dispatch, queryFulfilled, getState }) => {
				try {
					await queryFulfilled
					const state = getState() as RootState
					// if user is an admin, automatically fetch allGroupChildren and update the
					if (selectIsAdmin(state)) {
						const { data = [] } = await dispatch(groupsApi.endpoints.getAllGroupsChildren.initiate(undefined, { subscribe: false }))
						// Map the data to the format needed for updateMany
						const updates: Update<GroupData, number>[] = data.map(childrenInfo => ({
							id: childrenInfo.groupId,
							changes: {
								childMeters: childrenInfo.childMeters,
								childGroups: childrenInfo.childGroups
							}
						}));
						dispatch(groupsApi.util.updateQueryData('getGroups', undefined, groupDataById => { groupsAdapter.updateMany(groupDataById, updates) }))
					}
				} catch (e) {
					console.log(e)
				}
			},
			providesTags: ['GroupData']
		}),
		getAllGroupsChildren: builder.query<GroupChildren[], void>({
			query: () => 'api/groups/allChildren',
			providesTags: ['GroupChildrenData']
		}),
		createGroup: builder.mutation<void, GroupData>({
			query: groupData => ({
				url: 'api/groups/create',
				method: 'POST',
				// omit the 'id' property of the groupData or api errors/fails
				body: _.omit(groupData, 'id')
			}),
			invalidatesTags: ['GroupData', 'GroupChildrenData']
		}),
		editGroup: builder.mutation<void, Omit<GroupData, 'deepMeters'>>({
			query: group => ({
				url: 'api/groups/edit',
				method: 'PUT',
				body: group
			})
		}),
		deleteGroup: builder.mutation<void, number>({
			query: groupId => ({
				url: 'api/groups/delete',
				method: 'POST',
				body: { id: groupId }
			}),
			invalidatesTags: ['GroupData', 'GroupChildrenData']
		}),
		getParentIDs: builder.query<number[], number>({
			query: groupId => `api/groups/parents/${groupId}`
		})
	})
})

export const selectGroupDataResult = groupsApi.endpoints.getGroups.select();

export const {
	selectAll: selectAllGroups,
	selectById: selectGroupById,
	selectTotal: selectGroupTotal,
	selectIds: selectGroupIds,
	selectEntities: selectGroupDataById
} = groupsAdapter.getSelectors((state: RootState) => selectGroupDataResult(state).data ?? groupsInitialState)


export const selectGroupNameWithID = (state: RootState, groupId: number) => {
	const groupInfo = selectGroupById(state, groupId)
	return groupInfo ? groupInfo.name : '';
}