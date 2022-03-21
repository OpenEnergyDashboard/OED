/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { State } from '../types/redux/state';
import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { conversionArrayApi } from '../utils/api';
import * as t from '../types/redux/conversionArray';
import { ConversionArrayRequestItem } from '../types/redux/conversionArray';

export function requestConversionArray(): t.RequestConversionArrayAction {
	return { type: ActionType.RequestConversionArray };
}

export function receiveConversionArray(data: ConversionArrayRequestItem): t.ReceiveConversionArrayAction {
	return { type: ActionType.ReceiveConversionArray, data };
}

export function fetchConversionArray(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestConversionArray());
		const conversionArray = await conversionArrayApi.getConversionArray();
		dispatch(receiveConversionArray(conversionArray));
	}
}

function shouldFetchConversionArray(state: State) {
	return !state.conversionArray.isFetching;
}

export function fetchConversionArrayIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchConversionArray(getState())) {
			return dispatch(fetchConversionArray());
		}
		return Promise.resolve();
	};
}