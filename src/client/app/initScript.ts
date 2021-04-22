/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Dispatch } from './types/redux/actions';
import { fetchCurrentUserIfNeeded } from './actions/currentUser';

// The purpose of this is to store the user's role or any other information that would rarely change just once into the store.
export default function initScript()  {
	return (dispatch: Dispatch) => {
		dispatch(fetchCurrentUserIfNeeded());
	};
}
