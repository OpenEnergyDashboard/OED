// https://redux-toolkit.js.org/api/createListenerMiddleware#typescript-usage
import { isAnyOf } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import {
	graphSlice, setGraphState,
	setHotlinked, setOptionsVisibility, toggleOptionsVisibility,
	traverseNextHistory, traversePrevHistory, updateHistory
} from '../../reducers/graph';
import { AppStartListening } from './middleware';

export const historyMiddleware = (startListening: AppStartListening) => {

	startListening({
		predicate: (action, currentState, previousState) => {
			// deep compare of previous state added mostly due to potential state triggers/ dispatches that may not actually alter state
			// For example 'popping' values from react-select w/ backspace when empty
			return isHistoryTrigger(action) && !_.isEqual(currentState.graph, previousState.graph)
		},
		effect: (_action, { dispatch, getOriginalState }) => {
			const prev = getOriginalState().graph.current
			dispatch(updateHistory(prev))
		}
	})

}

// listen to all graphSlice actions
const isHistoryTrigger = isAnyOf(
	...Object.values(graphSlice.actions)
		.filter(action => !(
			// filter out the ones don't directly alter the graph, or ones which can cause infinite recursion
			// we use updateHistory here, so listening for updateHistory would cause infinite loops etc.
			toggleOptionsVisibility.match(action) ||
			setOptionsVisibility.match(action) ||
			setHotlinked.match(action) ||
			setGraphState.match(action) ||
			updateHistory.match(action) ||
			traverseNextHistory.match(action) ||
			traversePrevHistory.match(action)
		))
)