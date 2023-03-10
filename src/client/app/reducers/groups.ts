/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { ActionType } from '../types/redux/actions';
import { DisplayMode, GroupsAction, GroupsState } from '../types/redux/groups';

const defaultState: GroupsState = {
	isFetching: false,
	outdated: true,
	byGroupID: {},
	selectedGroups: [],
	groupInEditing: {
		dirty: false
	},
	displayMode: DisplayMode.View
};

/* eslint-disable */

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

		// The following are reducers related to creating and editing groups
		case ActionType.ChangeGroupsUIDisplayMode: {
			const validModes = _.values(DisplayMode);
			if (_.includes(validModes, action.newMode)) {
				return {
					...state,
					displayMode: action.newMode,
					groupInEditing: {
						dirty: false
					},
					selectedGroups: [] // zero out selected groups when we switch screens
				};
			}
			return state;
		}

		case ActionType.CreateNewBlankGroup: {
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
						displayable: true,
						note: '',
						childGroups: [],
						childMeters: []
					}
				};
			}
			return state;
		}

		case ActionType.BeginEditingGroup: {
			if (!state.groupInEditing.dirty) {
				const currentGroup = state.byGroupID[action.groupID];
				const toEdit = {
					dirty: false,
					submitted: false,
					id: currentGroup.id,
					name: currentGroup.name,
					gps: currentGroup.gps,
					displayable: currentGroup.displayable,
					note: currentGroup.note,
					area: currentGroup.area,
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

		case ActionType.EditGroupName: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					name: action.newName,
					dirty: true
				}
			};
		}

		case ActionType.EditGroupGPS: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					gps: action.newGPS,
					dirty: true
				}
			};
		}

		case ActionType.EditGroupDisplayable: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					displayable: action.newDisplay,
					dirty: true
				}
			};
		}

		case ActionType.EditGroupNote: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					note: action.newNote,
					dirty: true
				}
			};
		}

		case ActionType.EditGroupArea: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					area: action.newArea,
					dirty: true
				}
			};
		}

		case ActionType.ChangeChildGroups: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					childGroups: action.groupIDs,
					dirty: true
				}
			};
		}

		case ActionType.ChangeChildMeters: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					childMeters: action.meterIDs,
					dirty: true
				}
			};
		}

		case ActionType.MarkGroupInEditingSubmitted: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					submitted: true
				}
			};
		}

		case ActionType.MarkGroupInEditingNotSubmitted: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					submitted: false
				}
			};
		}

		case ActionType.MarkGroupInEditingClean: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					dirty: false
				}
			};
		}

		case ActionType.MarkGroupInEditingDirty: {
			return {
				...state,
				groupInEditing: {
					...state.groupInEditing,
					dirty: true
				}
			};
		}

		case ActionType.MarkGroupsByIDOutdated: {
			return {
				...state,
				outdated: true
			};
		}

		case ActionType.MarkOneGroupOutdated: {
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
