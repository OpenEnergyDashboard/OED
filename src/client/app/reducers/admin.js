/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as adminActions from '../actions/admin';

const defaultState = {
	title: 'Open Energy Dashboard'
};

export default function admin(state = defaultState, action) {
	switch (action.type) {
		case adminActions.UPDATE_TITLE:
			return {
				...state,
				title: action.title
			};
		default: return state;
	}
}
