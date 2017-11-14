/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import * as metersActions from '../actions/meters';

/**
 * @typedef {Object} State~Meters
 * @property {boolean} isFetching
 * @property {Object<number, Object>} byMeterID
 */

const defaultState = {
	isFetching: false,
	byMeterID: {}
};

/**
 * @param {State~Meters} state
 * @param action
 * @return {State~Meters}
 */
export default function meters(state = defaultState, action) {
	switch (action.type) {
		case metersActions.REQUEST_METERS_DETAILS:
			return {
				...state,
				isFetching: true
			};
		case metersActions.RECEIVE_METERS_DETAILS:
			return {
				...state,
				isFetching: false,
				byMeterID: _.keyBy(action.data, meter => meter.id)
			};
		default:
			return state;
	}
}
