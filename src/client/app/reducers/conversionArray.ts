/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from '../types/redux/actions';
import { ConversionArrayAction } from '../types/redux/conversionArray';

const defaultState = {
	isFetching: false,
	pikArray: []
};

export default function conversionArray(state = defaultState, action: ConversionArrayAction) {
	switch (action.type) {
		case ActionType.RequestConversionArray:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveConversionArray:
			return {
				...state,
				isFetching: false,
				pikArray: action.data
			};
		default:
			return state;
	}
}