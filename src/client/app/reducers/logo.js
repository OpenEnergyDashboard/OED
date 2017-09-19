/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as logosActions from '../actions/logo';

const defaultState = {
	showColored: false,
};

/**
 * Reduce based on logo actions. Only handles
 * @param {State} state The Redux state
 * @param {String} action The action to be reduced
 */
export default function logo(state = defaultState, action) {
	switch (action.type) {
		case logosActions.LOGO_STATE_CHANGED: {
			return {
				...state,
				showColored: action.showColored,
			};
		}
		default: { return state; }
	}
}
