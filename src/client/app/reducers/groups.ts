/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { GroupsState, DisplayMode } from '../types/redux/groups';
import * as t from '../types/redux/groups';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { groupsApi } from '../redux/api/groupsApi';

const defaultState: GroupsState = {
	hasBeenFetchedOnce: false,
	// Has the child meters and groups of all groups already been put into state.
	hasChildrenBeenFetchedOnce: false,
	isFetching: false,
	// Are we currently getting the child meters/groups for all groups.
	isFetchingAllChildren: false,
	byGroupID: {},
	selectedGroups: [],
	// TODO groupInEditing: {
	// 	dirty: false
	// },
	displayMode: DisplayMode.View
};

export const groupsSlice = createSlice({
	name: 'groups',
	initialState: defaultState,
	reducers: {
		confirmGroupsFetchedOnce: state => {
			state.hasBeenFetchedOnce = true;
		},
		confirmAllGroupsChildrenFetchedOnce: state => {
			// Records if all group meter/group children have been fetched at least once.
			// Normally just once but can reset to get it to fetch again.
			state.hasChildrenBeenFetchedOnce = true;
		},
		requestGroupsDetails: state => {
			state.isFetching = true;
		},
		receiveGroupsDetails: (state, action: PayloadAction<t.GroupDetailsData[]>) => {
			const newGroups = action.payload.map(group => ({
				...group,
				isFetching: false,
				// Sometimes OED fetches both the details and the child meters/groups as separate actions. Since the order they will happen is
				// uncertain, we need to preserve the child meters/groups if they exist. If not, put empty so no issues when accessing in other
				// places. Note this may be the wrong values but they should refresh quickly once all actions are done.
				childGroups: (state.byGroupID[group.id] && state.byGroupID[group.id].childGroups) ? state.byGroupID[group.id].childGroups : [],
				childMeters: (state.byGroupID[group.id] && state.byGroupID[group.id].childMeters) ? state.byGroupID[group.id].childMeters : [],
				selectedGroups: [],
				selectedMeters: [],
				deepMeters: group.deepMeters ? group.deepMeters : []
			}));
			// newGroups is an array: this converts it into a nested object where the key to each group is its ID.
			// Without this, byGroupID will not be keyed by group ID.
			state.isFetching = false;
			// TODO FIX TYPES HERE Weird interaction here
			state.byGroupID = _.keyBy(newGroups, 'id');
		},
		requestGroupChildren: (state, action: PayloadAction<number>) => {
			// Make no changes except setting isFetching = true for the group whose children we are fetching.
			state.byGroupID[action.payload].isFetching = true;
		},
		receiveGroupChildren: (state, action: PayloadAction<{ groupID: number, data: { meters: number[], groups: number[], deepMeters: number[] } }>) => {
			state.byGroupID[action.payload.groupID].isFetching = false;
			state.byGroupID[action.payload.groupID].childGroups = action.payload.data.groups;
			state.byGroupID[action.payload.groupID].childMeters = action.payload.data.meters;
			state.byGroupID[action.payload.groupID].deepMeters = action.payload.data.deepMeters;
		},
		requestAllGroupsChildren: state => {
			state.isFetchingAllChildren = true;
			// When the group children are forced to be re-fetched on creating a new group, we need to indicate
			// here that the children are not yet gotten. This causes the group detail page to redraw when this
			// is finished so the new group has the latest info.
			state.hasChildrenBeenFetchedOnce = false;
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
			// Note that not fetching children
			state.isFetchingAllChildren = false
		},
		changeDisplayedGroups: (state, action: PayloadAction<number[]>) => {
			state.selectedGroups = action.payload;
		}, confirmEditedGroup: (state, action: PayloadAction<t.GroupEditData>) => {
			// Return new state object with updated edited group info.
			state.byGroupID[action.payload.id] = {
				// There is state that is in each group that is not part of the edit information state.
				...state.byGroupID[action.payload.id],
				...action.payload
			};
		}
	},
	extraReducers: builder => {
		builder.addMatcher(groupsApi.endpoints.getGroups.matchFulfilled,
			(state, { payload }) => {
				const newGroups = payload.map(group => ({
					...group,
					isFetching: false,
					// Sometimes OED fetches both the details and the child meters/groups as separate actions. Since the order they will happen is
					// uncertain, we need to preserve the child meters/groups if they exist. If not, put empty so no issues when accessing in other
					// places. Note this may be the wrong values but they should refresh quickly once all actions are done.
					childGroups: (state.byGroupID[group.id] && state.byGroupID[group.id].childGroups) ? state.byGroupID[group.id].childGroups : [],
					childMeters: (state.byGroupID[group.id] && state.byGroupID[group.id].childMeters) ? state.byGroupID[group.id].childMeters : [],
					selectedGroups: [],
					selectedMeters: [],

					// TODO Verify this reducer.
					// line added due to conflicting typing. TS Warns about potential undefined deepMeters
					deepMeters: group.deepMeters ? group.deepMeters : []
				}));
				// newGroups is an array: this converts it into a nested object where the key to each group is its ID.
				// Without this, byGroupID will not be keyed by group ID.
				state.isFetching = false;
				// TODO FIX TYPES HERE Weird interaction here
				state.byGroupID = _.keyBy(newGroups, 'id');
			}
		)
	}
});