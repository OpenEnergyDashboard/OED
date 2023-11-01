/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { groupsApi } from '../redux/api/groupsApi';
import * as t from '../types/redux/groups';
import { GroupsState } from '../types/redux/groups';

const defaultState: GroupsState = {
	byGroupID: {},
	selectedGroups: []
	// TODO groupInEditing: {
	// 	dirty: false
	// },
};

export const groupsSlice = createSlice({
	name: 'groups',
	initialState: defaultState,
	reducers: {
		receiveGroupsDetails: (state, action: PayloadAction<t.GroupData[]>) => {
			const newGroups = action.payload.map(group => ({
				...group,
				isFetching: false,
				// Sometimes OED fetches both the details and the child meters/groups as separate actions. Since the order they will happen is
				// uncertain, we need to preserve the child meters/groups if they exist. If not, put empty so no issues when accessing in other
				// places. Note this may be the wrong values but they should refresh quickly once all actions are done.
				childGroups: (state.byGroupID[group.id] && state.byGroupID[group.id].childGroups) ? state.byGroupID[group.id].childGroups : [],
				childMeters: (state.byGroupID[group.id] && state.byGroupID[group.id].childMeters) ? state.byGroupID[group.id].childMeters : [],
				selectedGroups: [],
				selectedMeters: []
			}));
			// newGroups is an array: this converts it into a nested object where the key to each group is its ID.
			// Without this, byGroupID will not be keyed by group ID.
			// TODO FIX TYPES HERE Weird interaction here
			state.byGroupID = _.keyBy(newGroups, 'id');
		},
		receiveGroupChildren: (state, action: PayloadAction<{ groupID: number, data: { meters: number[], groups: number[], deepMeters: number[] } }>) => {
			state.byGroupID[action.payload.groupID].childGroups = action.payload.data.groups;
			state.byGroupID[action.payload.groupID].childMeters = action.payload.data.meters;
			state.byGroupID[action.payload.groupID].deepMeters = action.payload.data.deepMeters;
		},
		receiveAllGroupsChildren: (state, action: PayloadAction<t.GroupChildren[]>) => {
			// For each group that received data, set the children meters and groups.
			for (const groupInfo of action.payload) {
				// Group id of the current item
				const groupId = groupInfo.groupId;
				// Reset the newState for this group to have child meters/groups.
				state.byGroupID[groupId].childMeters = groupInfo.childMeters;
				state.byGroupID[groupId].childGroups = groupInfo.childGroups;
			}
		}
	},
	// TODO Much of this logic is duplicated due to migration trying not to change too much at once.
	// When no longer needed remove base reducers if applicable, or delete slice entirely and rely solely on api cache
	extraReducers: builder => {
		builder.addMatcher(groupsApi.endpoints.getGroups.matchFulfilled,
			(state, { payload }) => { state.byGroupID = payload })
			.addMatcher(groupsApi.endpoints.getAllGroupsChildren.matchFulfilled,
				(state, action) => {
					// For each group that received data, set the children meters and groups.
					for (const groupInfo of action.payload) {
						// Group id of the current item
						const groupId = groupInfo.groupId;
						// Reset the newState for this group to have child meters/groups.
						state.byGroupID[groupId].childMeters = groupInfo.childMeters;
						state.byGroupID[groupId].childGroups = groupInfo.childGroups;
					}
				})

	},
	selectors: {
		selectGroupState: state => state
	}
})
