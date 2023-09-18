/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { GroupsState, DisplayMode } from '../types/redux/groups';
import * as t from '../types/redux/groups';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
				deepMeters: []
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
	}
});
// export default function groups(state = defaultState, action: GroupsAction) {
// 	switch (action.type) {
// 		// Records if group details have been fetched at least once
// 		case ActionType.groupsSlice.actions.confirmGroupsFetchedOnce: {
// 			return {
// 				...state,
// 				hasBeenFetchedOnce: true
// 			};
// 		}
// 		// Records if all group meter/group children have been fetched at least once.
// 		// Normally just once but can reset to get it to fetch again.
// 		case ActionType.groupsSlice.actions.confirmAllGroupsChildrenFetchedOnce: {
// 			return {
// 				...state,
// 				hasChildrenBeenFetchedOnce: true
// 			};
// 		}
// 		// The following are reducers related to viewing and fetching groups data
// 		case ActionType.groupsSlice.actions.requestGroupsDetails:
// 			return {
// 				...state,
// 				isFetching: true
// 			};
// 		case ActionType.groupsSlice.actions.receiveGroupsDetails: {
// 			/*
// 			 add new fields to each group object:
// 			 isFetching flag for each group
// 			 arrays to store the IDs of child groups and Meters. We get all other data from other parts of state.

// 			 NOTE: if you get an error here saying `action.data.map` is not a function, please comment on
// 			 this issue: https://github.com/OpenEnergyDashboard/OED/issues/86
// 			 */
// 			const newGroups = action.data.map(group => ({
// 				...group,
// 				isFetching: false,
// 				// Sometimes OED fetches both the details and the child meters/groups as separate actions. Since the order they will happen is
// 				// uncertain, we need to preserve the child meters/groups if they exist. If not, put empty so no issues when accessing in other
// 				// places. Note this may be the wrong values but they should refresh quickly once all actions are done.
// 				childGroups: (state.byGroupID[group.id] && state.byGroupID[group.id].childGroups) ? state.byGroupID[group.id].childGroups : [],
// 				childMeters: (state.byGroupID[group.id] && state.byGroupID[group.id].childMeters) ? state.byGroupID[group.id].childMeters : [],
// 				selectedGroups: [],
// 				selectedMeters: []
// 			}));
// 			// newGroups is an array: this converts it into a nested object where the key to each group is its ID.
// 			// Without this, byGroupID will not be keyed by group ID.
// 			const newGroupsByID = _.keyBy(newGroups, 'id');
// 			// Note that there is an `isFetching` for groups as a whole AND one for each group.
// 			return {
// 				...state,
// 				isFetching: false,
// 				byGroupID: newGroupsByID
// 			};
// 		}

// 		case ActionType.groupsSlice.actions.requestGroupChildren: {
// 			// Make no changes except setting isFetching = true for the group whose children we are fetching.
// 			return {
// 				...state,
// 				byGroupID: {
// 					...state.byGroupID,
// 					[action.groupID]: {
// 						...state.byGroupID[action.groupID],
// 						isFetching: true
// 					}
// 				}

// 			};
// 		}

// 		case ActionType.groupsSlice.actions.receiveGroupChildren: {
// 			// Set isFetching = false for the group, and set the group's children to the arrays in the response.
// 			return {
// 				...state,
// 				byGroupID: {
// 					...state.byGroupID,
// 					[action.groupID]: {
// 						...state.byGroupID[action.groupID],
// 						isFetching: false,
// 						childGroups: action.data.groups,
// 						childMeters: action.data.meters,
// 						deepMeters: action.data.deepMeters
// 					}
// 				}
// 			};
// 		}

// 		// When start fetching all groups meters/groups children.
// 		case ActionType.groupsSlice.actions.requestAllGroupsChildren: {
// 			// Note that fetching
// 			return {
// 				...state,
// 				isFetchingAllChildren: true,
// 				// When the group children are forced to be re-fetched on creating a new group, we need to indicate
// 				// here that the children are not yet gotten. This causes the group detail page to redraw when this
// 				// is finished so the new group has the latest info.
// 				hasChildrenBeenFetchedOnce: false
// 			}
// 		}

// 		// When receive all groups meters/groups children.
// 		case ActionType.groupsSlice.actions.receiveAllGroupsChildren: {
// 			// Set up temporary state so only change/return once.
// 			const newState: GroupsState = {
// 				...state,
// 				byGroupID: {
// 					...state.byGroupID
// 				}
// 			}
// 			// For each group that received data, set the children meters and groups.
// 			for (const groupInfo of action.data) {
// 				// Group id of the current item
// 				const groupId = groupInfo.groupId;
// 				// Reset the newState for this group to have child meters/groups.
// 				newState.byGroupID[groupId].childMeters = groupInfo.childMeters;
// 				newState.byGroupID[groupId].childGroups = groupInfo.childGroups;
// 			}
// 			// Note that not fetching children
// 			newState.isFetchingAllChildren = false
// 			// The updated state.
// 			return newState;
// 		}

// 		case ActionType.ChangeDisplayedGroups: {
// 			return {
// 				...state,
// 				selectedGroups: action.groupIDs
// 			};
// 		}

// 		case ActionType.ConfirmEditedGroup: {
// 			// Return new state object with updated edited group info.
// 			return {
// 				...state,
// 				byGroupID: {
// 					...state.byGroupID,
// 					[action.editedGroup.id]: {
// 						// There is state that is in each group that is not part of the edit information state.
// 						...state.byGroupID[action.editedGroup.id],
// 						...action.editedGroup
// 					}
// 				}
// 			};
// 		}

// 		default:
// 			return state;
// 	}
// }