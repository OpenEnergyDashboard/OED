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
 * @property {boolean} outdated
 * @property {Object<number, Object>} byGroupID
 * @property {Object} groupInEditing
 */
const defaultState = {
	isFetching: false,
	outdated: true,
	byGroupID: {},
	selectedGroups: [],
	groupInEditing: {
		dirty: false
	},
	displayMode: 'view'
};

/**
 * @param {State~Groups} state
 * @param action
 * @return {State~Groups}
 */
export default function groups(state = defaultState, action) {
	switch (action.type) {
		// The following are reducers related to viewing and fetching groups data
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
				outdated: true,
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
				outdated: false,
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

		case groupsActions.CHANGE_DISPLAYED_GROUPS: {
			return {
				...state,
				selectedGroups: action.groupIDs,
			};
		}

		case groupsActions.CHANGE_SELECTED_GROUPS_PER_GROUP: {
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

		case groupsActions.CHANGE_SELECTED_METERS_PER_GROUP: {
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

		// The following are reducers related to creating and editing groups
		case groupsActions.CHANGE_GROUPS_UI_DISPLAY_MODE: {
			const validModes = ['view', 'edit', 'create'];
			if (_.includes(validModes, action.newMode)) {
				return {
					...state,
					displayMode: action.newMode
				};
			}
			return state;
		}

		case groupsActions.CREATE_NEW_BLANK_GROUP: {
			if (!state.groupInEditing.dirty) {
				return {
					...state,
					groupInEditing: {
						// False when the changes are successfully inserted into the db OR the user cancels the editing
						// OR when no changes have been made
						dirty: false,
						// True when a request to insert the changes into the DB has been sent
						submitted: false,
						name: '',
						childGroups: [],
						childMeters: []
					}
				};
			}
			return state;
		}

		case groupsActions.BEGIN_EDITING_GROUP: {
			if (!state.groupInEditing.dirty) {
				const currentGroup = state.byGroupID[action.groupID];
				const toEdit = {
					dirty: false,
					submitted: false,
					id: currentGroup.id,
					name: currentGroup.name,
					childGroups: currentGroup.childGroups,
					childMeters: currentGroup.childMeters
				};
				return {
					...state,
					groupInEditing: toEdit
				};
			}
			return state;
		}

		case groupsActions.EDIT_GROUP_NAME: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					name: action.newName,
					dirty: true
				}
			};
		}

		case groupsActions.CHANGE_CHILD_GROUPS: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					childGroups: action.groupIDs,
					dirty: true
				}
			};
		}

		case groupsActions.CHANGE_CHILD_METERS: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					childMeters: action.meterIDs,
					dirty: true
				}
			};
		}

		case groupsActions.MARK_GROUP_IN_EDITING_SUBMITTED: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					submitted: true
				}
			};
		}

		case groupsActions.MARK_GROUP_IN_EDITING_NOT_SUBMITTED: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					submitted: false
				}
			};
		}

		case groupsActions.MARK_GROUP_IN_EDITING_CLEAN: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					dirty: false
				}
			};
		}

		case groupsActions.MARK_GROUPS_BY_ID_OUTDATED: {
			return {
				...state,
				outdated: true
			};
		}

		case groupsActions.MARK_ONE_GROUP_OUTDATED: {
			return {
				...state,
				byGroupID: {
					...state.byGroupID,
					[action.groupID]: {
						...state.byGroupID[action.groupID],
						outdated: true
					}
				}
			};
		}


		default:
			return state;
	}
}
