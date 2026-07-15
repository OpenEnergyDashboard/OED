/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/*
 * TEMPORARY API MODULE
 *
 * Update these paths to match where the two Express routers are mounted.
 * For example, if the server uses:
 *   app.use('/api/holidayInstanceGroups', holidayInstanceGroupsRouter)
 *   app.use('/api/holidayGroupMembers', holidayGroupMembersRouter)
 * then the values below are correct with baseUrl '/api/'.
 */
const HOLIDAY_INSTANCE_GROUPS_PATH = 'holidayInstanceGroups';
const HOLIDAY_GROUP_MEMBERS_PATH = 'holidayGroupMembers';

export interface HolidayInstanceGroup {
	id: number;
	name: string;
	note: string;
}

export interface HolidayGroupMember {
	holidayInstanceGroupId: number;
	holidayInstanceId: number;
	holidayInstanceName?: string;
	holidayId?: number;
	dayPatternId?: number;
	holidayName?: string;
	startDate?: string;
	location?: string;
	dayPatternName?: string;
}

export interface HolidayInstanceGroupWithMembers extends HolidayInstanceGroup {
	holidayInstanceIds: number[];
}

export interface CreateHolidayInstanceGroupRequest {
	name: string;
	note: string;
	holidayInstanceIds: number[];
}

export interface EditHolidayInstanceGroupRequest extends CreateHolidayInstanceGroupRequest {
	id: number;
}

export const holidayInstanceGroupsApi = createApi({
	reducerPath: 'holidayInstanceGroupsApi',
	baseQuery: fetchBaseQuery({
		baseUrl: '/api/',
		credentials: 'include'
	}),
	tagTypes: ['HolidayInstanceGroups'],
	endpoints: builder => ({
		getHolidayInstanceGroups: builder.query<HolidayInstanceGroup[], void>({
			query: () => HOLIDAY_INSTANCE_GROUPS_PATH,
			providesTags: ['HolidayInstanceGroups']
		}),

		getHolidayGroupMembers: builder.query<HolidayGroupMember[], number>({
			query: holidayInstanceGroupId =>
				`${HOLIDAY_GROUP_MEMBERS_PATH}/group/${holidayInstanceGroupId}`,
			providesTags: ['HolidayInstanceGroups']
		}),

		getHolidayInstanceGroupsWithMembers: builder.query<HolidayInstanceGroupWithMembers[], void>({
			async queryFn(_argument, _queryApi, _extraOptions, fetchWithBQ) {
				const groupsResult = await fetchWithBQ(HOLIDAY_INSTANCE_GROUPS_PATH);
				if (groupsResult.error) {
					return { error: groupsResult.error };
				}

				const groups = groupsResult.data as HolidayInstanceGroup[];
				const groupsWithMembers: HolidayInstanceGroupWithMembers[] = [];
				for (const group of groups) {
					const membersResult = await fetchWithBQ(
						`${HOLIDAY_GROUP_MEMBERS_PATH}/group/${group.id}`
					);
					if (membersResult.error) {
						return { error: membersResult.error };
					}

					const members = membersResult.data as HolidayGroupMember[];
					groupsWithMembers.push({
						...group,
						holidayInstanceIds: members.map(member => member.holidayInstanceId)
					});
				}

				return { data: groupsWithMembers };
			},
			providesTags: ['HolidayInstanceGroups']
		}),

		addHolidayInstanceGroup: builder.mutation<HolidayInstanceGroupWithMembers, CreateHolidayInstanceGroupRequest>({
			async queryFn(request, _queryApi, _extraOptions, fetchWithBQ) {
				const groupResult = await fetchWithBQ({
					url: `${HOLIDAY_INSTANCE_GROUPS_PATH}/addHolidayInstanceGroup`,
					method: 'POST',
					body: {
						name: request.name,
						note: request.note
					}
				});
				if (groupResult.error) {
					return { error: groupResult.error };
				}

				const createdGroup = groupResult.data as HolidayInstanceGroup;
				for (const holidayInstanceId of request.holidayInstanceIds) {
					const memberResult = await fetchWithBQ({
						url: `${HOLIDAY_GROUP_MEMBERS_PATH}/add`,
						method: 'POST',
						body: {
							holidayInstanceGroupId: createdGroup.id,
							holidayInstanceId
						}
					});
					if (memberResult.error) {
						return { error: memberResult.error };
					}
				}

				return {
					data: {
						...createdGroup,
						holidayInstanceIds: request.holidayInstanceIds
					}
				};
			},
			invalidatesTags: ['HolidayInstanceGroups']
		}),

		editHolidayInstanceGroup: builder.mutation<void, EditHolidayInstanceGroupRequest>({
			async queryFn(request, _queryApi, _extraOptions, fetchWithBQ) {
				const membersResult = await fetchWithBQ(
					`${HOLIDAY_GROUP_MEMBERS_PATH}/group/${request.id}`
				);
				if (membersResult.error) {
					return { error: membersResult.error };
				}

				const currentMembers = membersResult.data as HolidayGroupMember[];
				const currentIds = new Set(currentMembers.map(member => member.holidayInstanceId));
				const requestedIds = new Set(request.holidayInstanceIds);

				const groupResult = await fetchWithBQ({
					url: `${HOLIDAY_INSTANCE_GROUPS_PATH}/edit`,
					method: 'POST',
					body: {
						id: request.id,
						name: request.name,
						note: request.note
					}
				});
				if (groupResult.error) {
					return { error: groupResult.error };
				}

				for (const holidayInstanceId of Array.from(currentIds)) {
					if (!requestedIds.has(holidayInstanceId)) {
						const deleteResult = await fetchWithBQ({
							url: `${HOLIDAY_GROUP_MEMBERS_PATH}/delete`,
							method: 'POST',
							body: {
								holidayInstanceGroupId: request.id,
								holidayInstanceId
							}
						});
						if (deleteResult.error) {
							return { error: deleteResult.error };
						}
					}
				}

				for (const holidayInstanceId of Array.from(requestedIds)) {
					if (!currentIds.has(holidayInstanceId)) {
						const addResult = await fetchWithBQ({
							url: `${HOLIDAY_GROUP_MEMBERS_PATH}/add`,
							method: 'POST',
							body: {
								holidayInstanceGroupId: request.id,
								holidayInstanceId
							}
						});
						if (addResult.error) {
							return { error: addResult.error };
						}
					}
				}

				return { data: undefined };
			},
			invalidatesTags: ['HolidayInstanceGroups']
		}),

		deleteHolidayInstanceGroup: builder.mutation<void, number>({
			async queryFn(holidayInstanceGroupId, _queryApi, _extraOptions, fetchWithBQ) {
				const membersResult = await fetchWithBQ({
					url: `${HOLIDAY_GROUP_MEMBERS_PATH}/deleteByGroup`,
					method: 'POST',
					body: { holidayInstanceGroupId }
				});
				if (membersResult.error) {
					return { error: membersResult.error };
				}

				const groupResult = await fetchWithBQ({
					url: `${HOLIDAY_INSTANCE_GROUPS_PATH}/delete`,
					method: 'POST',
					body: { id: holidayInstanceGroupId }
				});
				if (groupResult.error) {
					return { error: groupResult.error };
				}

				return { data: undefined };
			},
			invalidatesTags: ['HolidayInstanceGroups']
		})
	})
});

export const {
	useGetHolidayInstanceGroupsQuery,
	useGetHolidayGroupMembersQuery,
	useGetHolidayInstanceGroupsWithMembersQuery,
	useAddHolidayInstanceGroupMutation,
	useEditHolidayInstanceGroupMutation,
	useDeleteHolidayInstanceGroupMutation
} = holidayInstanceGroupsApi;
