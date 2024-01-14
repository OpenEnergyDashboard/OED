// https://redux-toolkit.js.org/api/createListenerMiddleware#typescript-usage
import { isAnyOf } from '@reduxjs/toolkit';
import { graphSlice, updateHistory } from '../slices/graphSlice';
import { AppStartListening } from './middleware';

export const historyMiddleware = (startListening: AppStartListening) => {

	startListening({
		predicate: (action, currentState, previousState) => {
			// compare of previous state added due to potential no-op dispatches
			// i.e. 'popping' values from react-select w/ backspace when empty, or clearing already unbounded time interval, etc.
			return isHistoryTrigger(action) && currentState.graph !== previousState.graph
		},
		effect: (_action, { dispatch, getOriginalState }) => {
			const prev = getOriginalState().graph.current
			dispatch(updateHistory(prev))
		}
	})

}

// listen to all graphSlice actions
const isHistoryTrigger = isAnyOf(...Object.values(graphSlice.actions))