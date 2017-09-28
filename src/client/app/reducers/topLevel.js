/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as topLevelActions from '../actions/topLevel';

const defaultState = {
	notification: {}
};

export default function topLevel(state = defaultState, action) {
	switch (action.type) {
		case topLevelActions.SEND_NOTIFICATION:
			return {
				...state,
				notification: action.notification
			};
		case topLevelActions.CLEAR_NOTIFICATIONS:
			return {
				...state,
				notification: {}
			};
		default:
			return state;
	}
}
