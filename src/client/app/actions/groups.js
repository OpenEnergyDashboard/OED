/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_GROUPS_DATA = 'REQUEST_GROUPS_DATA';
export const RECEIVE_GROUPS_DATA = 'RECEIVE_GROUPS_DATA';

export function requestGroupsData() {
	return { type: REQUEST_GROUPS_DATA };
}

export function receiveGroupsData(data) {
	return { type: RECEIVE_GROUPS_DATA, data };
}

function fetchGroupsData() {
	return dispatch => {
		dispatch(requestGroupsData());
		// This will get all groups data if exists.
		return axios.get('/api/groups/')
			.then(response => {
				dispatch(receiveGroupsData(response.data));
			});
	};
}

/**
 * @param {State} state
 */
function shouldFetchGroupsData(state) {
	return state.groups.isFetching || state.groups.groups === undefined;
}

export function fetchGroupsDataIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchGroupsData(getState())) {
			return dispatch(fetchGroupsData());
		}
		return Promise.resolve();
	};
}
