/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as _ from 'lodash';
import axios from 'axios';
import { ActionType, Dispatch, State, GetState, Thunk } from '../types/redux';
import { NamedIDItem } from '../types/items';

export interface RequestMetersDetailsAction {
	type: ActionType.RequestMetersDetails;
}

export interface ReceiveMetersDetailsAction {
	type: ActionType.ReceiveMetersDetails;
	data: NamedIDItem[];
}

export type MetersAction = RequestMetersDetailsAction | ReceiveMetersDetailsAction;

export function requestMetersDetails(): RequestMetersDetailsAction {
	return { type: ActionType.RequestMetersDetails };
}

export function receiveMetersDetails(data: NamedIDItem[]): ReceiveMetersDetailsAction {
	return { type: ActionType.ReceiveMetersDetails, data };
}

function fetchMetersDetails(): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(requestMetersDetails());
		return axios.get('/api/meters')
			.then(response => {
				dispatch(receiveMetersDetails(response.data));
			});
	};
}

/**
 * @param {State} state
 */
function shouldFetchMetersDetails(state: State): boolean {
	return !state.meters.isFetching && _.size(state.meters.byMeterID) === 0;
}

export function fetchMetersDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchMetersDetails(getState())) {
			return dispatch(fetchMetersDetails());
		}
		return Promise.resolve();
	};
}
