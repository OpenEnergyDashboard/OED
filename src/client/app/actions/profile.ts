/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { usersApi, verificationApi } from '../utils/api';
import { Thunk, ActionType, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/profile';
import { User } from '../types/items';
import { hasToken } from '../utils/token';

export function requestProfile(): t.RequestProfile {
	return { type: ActionType.RequestProfile };
}

export function receiveProfile(data: User): t.ReceiveProfile {
	return { type: ActionType.ReceiveProfile, data };
}

async function shouldFetchProfile(state: State): Promise<boolean> {
	return !state.profile.isFetching && hasToken() && (await verificationApi.checkTokenValid());
}

export function fetchProfile(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestProfile());
		const user = await usersApi.getProfile();
		return dispatch(receiveProfile(user));
	};
}

export function fetchProfileIfNeeded(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		if (await shouldFetchProfile(getState())) {
			return dispatch(fetchProfile());
		}
		return Promise.resolve();
	};
}
