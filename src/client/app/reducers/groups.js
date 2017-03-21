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
	byGroupID: {}
};

/**
 * @param {State~Groups} state
 * @param action
 * @return {State~Groups}
 */
export default function groups(state = defaultState, action) {
	switch (action.type) {
		case groupsActions.REQUEST_GROUPS_DATA:
			return {
				...state,
				isFetching: true
			};
		case groupsActions.RECEIVE_GROUPS_DATA:
			return {
				...state,
				isFetching: false,
				byGroupID: _.keyBy(action.data, group => group.id)
			};
		default:
			return state;
	}
}
