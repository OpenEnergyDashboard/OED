/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as metersFilterActions from '../actions/meters_filter';

/**
 * @typedef {Object} State~MetersFilter
 * @property {string} metersFilterTerm
 */
const defaultState = {
	metersFilterTerm: '',
};

/**
 * @param {State~MetersFilter} state
 * @param action
 * @return {State~MetersFilter}
 */
export default function metersFilter(state = defaultState, action) {
	switch (action.type) {
		case metersFilterActions.METERS_FILTER_CLEARED:
			return {
				...state,
				metersFilterTerm: '',
			};
		case metersFilterActions.METERS_FILTER_MODIFIED:
			return {
				...state,
				metersFilterTerm: action.term
			};
		default:
			return state;
	}
}
