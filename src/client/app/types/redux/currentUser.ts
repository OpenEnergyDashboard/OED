/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';
import { User } from '../items';

/*
* Defines the action interfaces used in the corresponding reducers.
*/

export interface RequestCurrentUser {
	type: ActionType.RequestCurrentUser;
}
export interface ReceiveCurrentUser {
	type: ActionType.ReceiveCurrentUser;
	data: User;
}

export interface ClearCurrentUser {
	type: ActionType.ClearCurrentUser;
}

export type CurrentUserAction = RequestCurrentUser | ReceiveCurrentUser | ClearCurrentUser;

export interface CurrentUserState {
	isFetching: boolean;
	profile: User | null;
}
