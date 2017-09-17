/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import * as groupsActions from '../actions/groups';

/**
 * @typedef {Object} State~Groups
 * @property {boolean} isFetching
 * @property {Object<number, Object>} byGroupID
 */
const defaultState = {
	isFetching: false,
	byGroupID: {},
	selectedGroups: [],
	groupInEditing: {},
};

/**
 * @param {State~Groups} state
 * @param action
 * @return {State~Groups}
 */
export default function groups(state = defaultState, action) {
	switch (action.type) {
		case groupsActions.REQUEST_GROUPS_DETAILS:
			return {
				...state,
				isFetching: true
			};
		case groupsActions.RECEIVE_GROUPS_DETAILS: {
			/*
			 add new fields to each group object:
			 isFetching flag for each group
			 arrays to store the IDs of child groups and Meters. We get all other data from other parts of state.

			 NOTE: if you get an error here saying `action.data.map` is not a function, please comment on
			 this issue: https://github.com/beloitcollegecomputerscience/OED/issues/86
			 */
			const newGroups = action.data.map(group => ({
				...group,
				isFetching: false,
				childGroups: [],
				childMeters: [],
				selectedGroups: [],
				selectedMeters: [],
			}));
			// newGroups is an array: this converts it into a nested object where the key to each group is its ID.
			// Without this, byGroupID will not be keyed by group ID.
			const newGroupsByID = _.keyBy(newGroups, 'id');
			// Note that there is an `isFetching` for groups as a whole AND one for each group.
			return {
				...state,
				isFetching: false,
				byGroupID: newGroupsByID,
			};
		}

		case groupsActions.REQUEST_GROUP_CHILDREN: {
			// Make no changes except setting isFetching = true for the group whose children we are fetching.
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.groupID]: {
						...state.byGroupID[action.groupID],
						isFetching: true,
					}
				}

			};
		}

		case groupsActions.RECEIVE_GROUP_CHILDREN: {
			// Set isFetching = false for the group, and set the group's children to the arrays in the response.
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.groupID]: {
						...state.byGroupID[action.groupID],
						isFetching: false,
						childGroups: action.data.groups,
						childMeters: action.data.meters,
					}
				}
			};
		}

		case groupsActions.GROUPSUI_CHANGE_SELECTED_GROUPS_PER_GROUP: {
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.parentID]: {
						...state.byGroupID[action.parentID],
						selectedGroups: action.groupIDs,
					}
				}
			};
		}

		case groupsActions.GROUPSUI_CHANGE_SELECTED_METERS_PER_GROUP: {
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.parentID]: {
						...state.byGroupID[action.parentID],
						selectedMeters: action.meterIDs,
					}
				}
			};
		}

		case groupsActions.GROUPSUI_CHANGE_DISPLAYED_GROUPS: {
			return {
				...state,
				selectedGroups: action.groupIDs,
			};
		}

		case groupsActions.CREATE_NEW_GROUP: {
			return {
				...state,
				groupInEditing: {
					name: null,
					childGroups: [],
					childMeters: []
				}
			};
		}

		case groupsActions.EDIT_GROUP_NAME: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					name: action.newName
				}
			};
		}

		case groupsActions.ADOPT_CHILD_GROUPS: {
			const validGroups = Object.keys(state.byGroupID).map(id => parseInt(id));
			const realGroups = _.intersection(validGroups, action.groupIDs);
			const children = _.union(state.groupInEditing.childGroups, realGroups);
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					childGroups: children
				}
			};
		}

		default:
			return state;
	}
}
