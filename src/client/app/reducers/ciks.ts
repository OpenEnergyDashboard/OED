/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { CiksAction, CiksState } from '../types/redux/ciks';
import { ActionType } from '../types/redux/actions';

const defaultState: CiksState = {
	hasBeenFetchedOne: false,
	isFetching: false,
	ciks: []
}

export default function ciks(state = defaultState, action: CiksAction) {
	switch (action.type) {
		case ActionType.ConfirmCiksFetchedOne:
			return {
				...state,
				hasBeenFetchedOne: true
			};
		case ActionType.RequestCiksDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveCiksDetails:
			return {
				...state,
				isFetching: false,
				ciks: action.data
			}
		default:
			return state;
	}
}

