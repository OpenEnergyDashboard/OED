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
	selectedMeters: [],
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
			// add new fields to each group object
			const newGroups = action.data.map(group => {
				return {
					...group,
					isFetching: false,
					childGroups: [],
					childMeters: [],
				};
			});
			const newGroupsByID = _.keyBy(newGroups, 'id');
			return {
				...state,
				isFetching: false,
				byGroupID: {
					...newGroupsByID,
				}
			};
		}

		case groupsActions.REQUEST_GROUP_CHILDREN: {
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

		default:
			return state;
	}
}
