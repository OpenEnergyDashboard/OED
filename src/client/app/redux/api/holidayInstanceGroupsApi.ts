/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import {
	CreateHolidayInstanceGroupPayload,
	HolidayGroupMember,
	HolidayInstanceGroup,
	UpdateHolidayInstanceGroupPayload
} from '../../types/redux/holidays';
import { baseApi } from './baseApi';

interface HolidayInstanceGroupResponse {
	id: number;
	name: string;
	note?: string | null;
}

interface HolidayGroupMemberPayload {
	holidayInstanceGroupId: number;
	holidayInstanceId: number;
}

const groupsUrl = 'api/holidayInstanceGroups';
const membersUrl = 'api/holidayGroupMembers';

/*
 * The backend stores group metadata and group membership in separate tables.
 * These endpoints present the page with one combined HolidayInstanceGroup and
 * coordinate both route families for every mutation.
 */
export const holidayInstanceGroupsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getHolidayInstanceGroups: builder.query<HolidayInstanceGroup[], void>({
			async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
				const groupsResult = await baseQuery(groupsUrl);
				if (groupsResult.error) {
					return { error: groupsResult.error };
				}

				const groups = groupsResult.data as HolidayInstanceGroupResponse[];
				const memberResults = await Promise.all(groups.map(group =>
					baseQuery(`${membersUrl}/group/${group.id}`)
				));

				const failedResult = memberResults.find(result => result.error);
				if (failedResult?.error) {
					return { error: failedResult.error };
				}

				return {
					data: groups.map((group, index) => ({
						id: group.id,
						name: group.name,
						note: group.note ?? '',
						holidayInstanceIds: (memberResults[index].data as HolidayGroupMember[])
							.map(member => member.holidayInstanceId)
					}))
				};
			},
			providesTags: result => result
				? [
					...result.map(({ id }) => ({ type: 'HolidayInstanceGroups' as const, id })),
					{ type: 'HolidayInstanceGroups', id: 'LIST' }
				]
				: [{ type: 'HolidayInstanceGroups', id: 'LIST' }]
		}),

		addHolidayInstanceGroup: builder.mutation<HolidayInstanceGroup, CreateHolidayInstanceGroupPayload>({
			async queryFn(group, _queryApi, _extraOptions, baseQuery) {
				const groupResult = await baseQuery({
					url: `${groupsUrl}/addHolidayInstanceGroup`,
					method: 'POST',
					body: { name: group.name, note: group.note }
				});
				if (groupResult.error) {
					return { error: groupResult.error };
				}

				const createdGroup = groupResult.data as HolidayInstanceGroupResponse;
				for (const holidayInstanceId of group.holidayInstanceIds) {
					const memberResult = await baseQuery({
						url: `${membersUrl}/add`,
						method: 'POST',
						body: {
							holidayInstanceGroupId: createdGroup.id,
							holidayInstanceId
						} as HolidayGroupMemberPayload
					});
					if (memberResult.error) {
						// Best-effort rollback prevents a partially-created group.
						await baseQuery({
							url: `${membersUrl}/deleteByGroup`,
							method: 'POST',
							body: { holidayInstanceGroupId: createdGroup.id }
						});
						await baseQuery({
							url: `${groupsUrl}/delete`,
							method: 'POST',
							body: { id: createdGroup.id }
						});
						return { error: memberResult.error };
					}
				}

				return {
					data: {
						id: createdGroup.id,
						name: createdGroup.name,
						note: createdGroup.note ?? '',
						holidayInstanceIds: group.holidayInstanceIds
					}
				};
			},
			invalidatesTags: [{ type: 'HolidayInstanceGroups', id: 'LIST' }]
		}),

		editHolidayInstanceGroup: builder.mutation<void, UpdateHolidayInstanceGroupPayload>({
			async queryFn(group, _queryApi, _extraOptions, baseQuery) {
				const currentMembersResult = await baseQuery(`${membersUrl}/group/${group.id}`);
				if (currentMembersResult.error) {
					return { error: currentMembersResult.error };
				}

				const editResult = await baseQuery({
					url: `${groupsUrl}/edit`,
					method: 'POST',
					body: { id: group.id, name: group.name, note: group.note }
				});
				if (editResult.error) {
					return { error: editResult.error };
				}

				const currentIds = new Set(
					(currentMembersResult.data as HolidayGroupMember[]).map(member => member.holidayInstanceId)
				);
				const requestedIds = new Set(group.holidayInstanceIds);
				const changes: Array<{ url: string; body: HolidayGroupMemberPayload }> = [];

				currentIds.forEach(holidayInstanceId => {
					if (!requestedIds.has(holidayInstanceId)) {
						changes.push({
							url: `${membersUrl}/delete`,
							body: { holidayInstanceGroupId: group.id, holidayInstanceId }
						});
					}
				});
				requestedIds.forEach(holidayInstanceId => {
					if (!currentIds.has(holidayInstanceId)) {
						changes.push({
							url: `${membersUrl}/add`,
							body: { holidayInstanceGroupId: group.id, holidayInstanceId }
						});
					}
				});

				for (const change of changes) {
					const changeResult = await baseQuery({
						url: change.url,
						method: 'POST',
						body: change.body
					});
					if (changeResult.error) {
						return { error: changeResult.error };
					}
				}

				return { data: undefined };
			},
			invalidatesTags: (_result, _error, arg) => [
				{ type: 'HolidayInstanceGroups', id: arg.id },
				{ type: 'HolidayInstanceGroups', id: 'LIST' }
			]
		}),

		deleteHolidayInstanceGroup: builder.mutation<void, Pick<HolidayInstanceGroup, 'id'>>({
			async queryFn({ id }, _queryApi, _extraOptions, baseQuery) {
				const currentMembersResult = await baseQuery(`${membersUrl}/group/${id}`);
				if (currentMembersResult.error) {
					return { error: currentMembersResult.error };
				}
				const currentMemberIds = (currentMembersResult.data as HolidayGroupMember[])
					.map(member => member.holidayInstanceId);

				const deleteMembersResult = await baseQuery({
					url: `${membersUrl}/deleteByGroup`,
					method: 'POST',
					body: { holidayInstanceGroupId: id }
				});
				if (deleteMembersResult.error) {
					return { error: deleteMembersResult.error };
				}

				const deleteGroupResult = await baseQuery({
					url: `${groupsUrl}/delete`,
					method: 'POST',
					body: { id }
				});
				if (deleteGroupResult.error) {
					// The group may still be referenced by another table. Restore its
					// members when the database refuses to delete the group itself.
					for (const holidayInstanceId of currentMemberIds) {
						await baseQuery({
							url: `${membersUrl}/add`,
							method: 'POST',
							body: { holidayInstanceGroupId: id, holidayInstanceId }
						});
					}
					return { error: deleteGroupResult.error };
				}

				return { data: undefined };
			},
			invalidatesTags: [{ type: 'HolidayInstanceGroups', id: 'LIST' }]
		})
	})
});

export const selectHolidayInstanceGroupsQueryState =
	holidayInstanceGroupsApi.endpoints.getHolidayInstanceGroups.select();
export const selectAllHolidayInstanceGroups = createSelector(
	selectHolidayInstanceGroupsQueryState,
	({ data: holidayInstanceGroups = [] }) => holidayInstanceGroups
);

export const stableEmptyHolidayInstanceGroups: HolidayInstanceGroup[] = [];

export const {
	useGetHolidayInstanceGroupsQuery,
	useAddHolidayInstanceGroupMutation,
	useEditHolidayInstanceGroupMutation,
	useDeleteHolidayInstanceGroupMutation
} = holidayInstanceGroupsApi;
