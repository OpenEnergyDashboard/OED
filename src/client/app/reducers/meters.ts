/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as _ from 'lodash';
import { MetersAction } from '../actions/meters';
import { ActionType } from '../types/redux';

/**
 * @typedef {Object} State~Meters
 * @property {boolean} isFetching
 * @property {Object<number, Object>} byMeterID
 */
export interface MetersState {
	isFetching: boolean;
	byMeterID: {
		[meterID: number]: {
			id: number;
			name: string;
		};
	};
}

const defaultState: MetersState = {
	isFetching: false,
	byMeterID: {}
};

/**
 * @param {State~Meters} state
 * @param action
 * @return {State~Meters}
 */
export default function meters(state = defaultState, action: MetersAction) {
	switch (action.type) {
		case ActionType.RequestMetersDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveMetersDetails:
			return {
				...state,
				isFetching: false,
				byMeterID: _.keyBy(action.data, meter => meter.id)
			};
		default:
			return state;
	}
}
