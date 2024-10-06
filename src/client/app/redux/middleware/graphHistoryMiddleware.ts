/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { isAnyOf } from '@reduxjs/toolkit';
import { AppListener } from '../listenerMiddleware';
import { graphSlice, updateHistory } from '../slices/graphSlice';

export const graphHistoryListener = (startListening: AppListener) => {
	startListening({
		predicate: (action, currentState, previousState) => {
			// compare of previous state added due to potential no-op dispatches
			// i.e. 'popping' values from react-select w/ backspace when empty, or clearing already unbounded time interval, etc.
			return isHistoryTrigger(action) && currentState.graph !== previousState.graph;
		},
		effect: (_action, { dispatch, getOriginalState }) => {
			const prev = getOriginalState().graph.current;
			dispatch(updateHistory(prev));
		}
	});
};

// listen to all graphSlice actions defined in graphSlice.reducers.
// Updating state via graphsSlice.extraReducers will not trigger history middleware
const isHistoryTrigger = isAnyOf(...Object.values(graphSlice.actions));
