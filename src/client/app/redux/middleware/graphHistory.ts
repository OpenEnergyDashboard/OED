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
			// deep compare of previous state added mostly due to potential state triggers from laying on backspace when deleting meters or groups.
			return isHistoryTrigger(action) &&
				!_.isEqual(currentState.graph, previousState.graph)
		}
		,
		effect: (action, { dispatch, getOriginalState }) => {
			console.log('Running', action)
			const prev = getOriginalState().graph.current
			dispatch(updateHistory(prev))
		}
	})

}

// we use updateHistory here, so listening for updateHistory would cause infinite loops etc.
const isHistoryTrigger = isAnyOf(
	// listen to all graphSlice actions
	...Object.values(graphSlice.actions)
		.filter(action => !(
			// filter out the ones don't directly alter the graph, or ones which can cause infinite recursion
			toggleOptionsVisibility.match(action) ||
			setOptionsVisibility.match(action) ||
			setHotlinked.match(action) ||
			setGraphState.match(action) ||
			updateHistory.match(action) ||
			traverseNextHistory.match(action) ||
			traversePrevHistory.match(action)
		))
)