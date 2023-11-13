import * as _ from 'lodash';
import { GroupChildren, GroupData, GroupDataByID } from '../../types/redux/groups';
import { baseApi } from './baseApi';
import { selectIsAdmin } from '../../reducers/currentUser';
import { RootState } from '../../store';
import { CompareReadings } from 'types/readings';
import { TimeInterval } from '../../../../common/TimeInterval';
import { createSelector } from '@reduxjs/toolkit';

export const groupsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getGroups: builder.query<GroupDataByID, void>({
			query: () => 'api/groups',
			transformResponse: (response: GroupData[]) => {
				const groupsData = response.map(groupData => ({
					...groupData,
					// endpoint doesn't return these so define them here or else undefined may cause issues on admin pages
					childMeters: [],
					childGroups: []
				}))
				return _.keyBy(groupsData, 'id')
			},
			onQueryStarted: async (_, api) => {
				try {
					await api.queryFulfilled
					const state = api.getState() as RootState
					const isAdmin = selectIsAdmin(state)
					// if user is an admin, automatically fetch allGroupChildren and update the
					if (isAdmin) {
						const { data = [] } = await api.dispatch(groupsApi.endpoints.getAllGroupsChildren.initiate(undefined))
						api.dispatch(groupsApi.util.updateQueryData('getGroups', undefined, groupDataById => {
							data.forEach(groupInfo => {
								const groupId = groupInfo.groupId;
								// Group id of the current item
								// Reset the newState for this group to have child meters/groups.
								groupDataById[groupId].childMeters = groupInfo.childMeters;
								groupDataById[groupId].childGroups = groupInfo.childGroups;
							})
						}))
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
		}),
		/**
		 * Gets compare readings for groups for the given current time range and a shift for previous time range
		 * @param groupIDs The group IDs to get readings for
		 * @param timeInterval  start and end of current/this compare period
		 * @param shift how far to shift back in time from current period to previous period
		 * @param unitID The unit id that the reading should be returned in, i.e., the graphic unit
		 * @returns CompareReadings in sorted order
		 */
		getCompareReadingsForGroups:
			builder.query<CompareReadings, { groupIDs: number[], timeInterval: TimeInterval, shift: moment.Duration, unitID: number }>({
				query: ({ groupIDs, timeInterval, shift, unitID }) => ({
					url: `/api/compareReadings/groups/${groupIDs.join(',')}`,
					params: {
						curr_start: timeInterval.getStartTimestamp().toISOString(),
						curr_end: timeInterval.getEndTimestamp().toISOString(),
						shift: shift.toISOString(),
						graphicUnitId: unitID.toString()
					}
				})
			})
	})
})

export const selectGroupDataByIdQueryState = groupsApi.endpoints.getGroups.select();
export const selectGroupDataById = createSelector(
	selectGroupDataByIdQueryState,
	({ data: groupDataById = {} }) => {
		return groupDataById
	}
)

export const selectGroupDataWithID = (state: RootState, groupId: number): GroupData | undefined => {
	const groupDataById = selectGroupDataById(state)
	return groupDataById[groupId]
}

export const selectGroupNameWithID = (state: RootState, groupId: number) => {
	const groupInfo = selectGroupDataWithID(state, groupId)
	return groupInfo ? groupInfo.name : '';
}