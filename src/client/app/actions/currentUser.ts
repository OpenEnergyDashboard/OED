/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { usersApi, verificationApi } from '../utils/api';
import { Thunk, ActionType, Dispatch, GetState } from '../types/redux/actions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/currentUser';
import { User } from '../types/items';
import { hasToken } from '../utils/token';

export function requestCurrentUser(): t.RequestCurrentUser {
	return { type: ActionType.RequestCurrentUser };
}

export function receiveCurrentUser(data: User): t.ReceiveCurrentUser {
	return { type: ActionType.ReceiveCurrentUser, data };
}

async function shouldFetchCurrentUser(state: State): Promise<boolean> {
	return !state.currentUser.isFetching && hasToken() && (await verificationApi.checkTokenValid());
}

export function fetchCurrentUser(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestCurrentUser());
		const user = await usersApi.getCurrentUser();
		return dispatch(receiveCurrentUser(user));
	};
}

export function fetchCurrentUserIfNeeded(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		if (await shouldFetchCurrentUser(getState())) {
			return dispatch(fetchCurrentUser());
		}
		return Promise.resolve();
	};
}
