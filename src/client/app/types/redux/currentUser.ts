/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// import { ActionType } from './actions';
import { User } from '../items';

export interface CurrentUserState {
	profile: User | null;
	token: string | null;
}
