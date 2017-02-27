/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios from 'axios';

export const REQUEST_METERS_DATA = 'REQUEST_METERS_DATA';
export const RECEIVE_METERS_DATA = 'RECEIVE_METERS_DATA';

export function requestMetersData() {
	return { type: REQUEST_METERS_DATA };
}

export function receiveMetersData(data) {
	return { type: RECEIVE_METERS_DATA, data };
}

function fetchMetersData() {
	return dispatch => {
		dispatch(requestMetersData());
		return axios.get('/api/meters')
			.then(response => {
				dispatch(receiveMetersData(response.data));
			});
	};
}

/**
 * @param {State} state
 */
function shouldFetchMetersData(state) {
	return state.meters.isFetching || state.meters.meters === undefined;
}

export function fetchMetersDataIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchMetersData(getState())) {
			return dispatch(fetchMetersData());
		}
		return Promise.resolve();
	};
}
