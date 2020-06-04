/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {MapAction, MapModeTypes, MapState} from '../types/redux/map';
import {ActionType} from '../types/redux/actions';

const defaultState: MapState = {
	mode: MapModeTypes.initiate,
	isLoading: false,
	source: ''
};

export default function map(state = defaultState, action: MapAction) {
	switch (action.type) {
		case ActionType.UpdateMapMode:
			return {
				...state,
				mode: action.nextMode
			};
		case ActionType.UpdateMapSource:
			return {
				...state,
				source: action.imageSource
			};
		default:
			return state;
	}
}
