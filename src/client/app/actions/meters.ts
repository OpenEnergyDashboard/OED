/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import axios from 'axios';
import { ActionType, Dispatch, GetState, Thunk } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/meters';
import { NamedIDItem } from '../types/items';


export function requestMetersDetails(): t.RequestMetersDetailsAction {
	return { type: ActionType.RequestMetersDetails };
}

export function receiveMetersDetails(data: NamedIDItem[]): t.ReceiveMetersDetailsAction {
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
