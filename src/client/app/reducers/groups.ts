/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { GroupsAction, GroupsState, DisplayMode } from '../types/redux/groups';
import { ActionType } from '../types/redux/actions';

const defaultState: GroupsState = {
	isFetching: false,
	outdated: true,
	byGroupID: {},
	selectedGroups: [],
	// TODO groupInEditing: {
	// 	dirty: false
	// },
	displayMode: DisplayMode.View
};


export default function groups(state = defaultState, action: GroupsAction) {
	switch (action.type) {
		// The following are reducers related to viewing and fetching groups data
		case ActionType.RequestGroupsDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveGroupsDetails: {
			/*
			 add new fields to each group object:
			 isFetching flag for each group
			 arrays to store the IDs of child groups and Meters. We get all other data from other parts of state.

			 NOTE: if you get an error here saying `action.data.map` is not a function, please comment on
			 this issue: https://github.com/OpenEnergyDashboard/OED/issues/86
			 */
			const newGroups = action.data.map(group => ({
				...group,
				isFetching: false,
				outdated: true,
				childGroups: [],
				childMeters: [],
				selectedGroups: [],
				selectedMeters: []
			}));
			// newGroups is an array: this converts it into a nested object where the key to each group is its ID.
			// Without this, byGroupID will not be keyed by group ID.
			const newGroupsByID = _.keyBy(newGroups, 'id');
			// Note that there is an `isFetching` for groups as a whole AND one for each group.
			return {
				...state,
				isFetching: false,
				outdated: false,
				byGroupID: newGroupsByID
			};
		}

		case ActionType.RequestGroupChildren: {
			// Make no changes except setting isFetching = true for the group whose children we are fetching.
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.groupID]: {
						...state.byGroupID[action.groupID],
						isFetching: true
					}
				}

			};
		}

		case ActionType.ReceiveGroupChildren: {
			// Set isFetching = false for the group, and set the group's children to the arrays in the response.
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.groupID]: {
						...state.byGroupID[action.groupID],
						isFetching: false,
						outdated: false,
						childGroups: action.data.groups,
						childMeters: action.data.meters,
						deepMeters: action.data.deepMeters
					}
				}
			};
		}

		case ActionType.ChangeDisplayedGroups: {
			return {
				...state,
				selectedGroups: action.groupIDs
			};
		}

		case ActionType.ChangeSelectedChildGroupsPerGroup: {
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.parentID]: {
						...state.byGroupID[action.parentID],
						selectedGroups: action.groupIDs
					}
				}
			};
		}

		case ActionType.ChangeSelectedChildMetersPerGroup: {
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.parentID]: {
						...state.byGroupID[action.parentID],
						selectedMeters: action.meterIDs
					}
				}
			};
		}

		case ActionType.ConfirmEditedGroup: {
			// Return new state object with updated edited meter info.
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.editedGroup.id]: {
						...action.editedGroup
					}
				}
			};
		}

		default:
			return state;
	}
}
