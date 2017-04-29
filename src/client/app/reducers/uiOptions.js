/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as uiOptions from '../actions/uiOptions';

/**
 * @type {State~UIOptions}
 */
const defaultState = {
	windowDimensions: {
		width: 0,
		height: 0
	},
};

/**
 * @param {State~UIOptions} state
 * @param action
 * @return {State~UIOptions}
 */
export default function graph(state = defaultState, action) {
	switch (action.type) {
		case uiOptions.UPDATE_WINDOW_DIMENSIONS:
			return {
				...state,
				windowDimensions: action.dimensions
			};
		default:
			return state;
	}
}
