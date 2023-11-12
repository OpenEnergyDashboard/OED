// https://redux-toolkit.js.org/api/createListenerMiddleware#typescript-usage
import { isAnyOf } from '@reduxjs/toolkit';
import { clearHistory, forwardHistory, prevHistory, selectBackHistoryTop, updateHistory } from '../../reducers/appStateSlice';
import { graphSlice, setGraphState, setHotlinked, setOptionsVisibility, toggleOptionsVisibility } from '../../reducers/graph';
import * as _ from 'lodash';
import { AppStartListening } from './middleware';

// This middleware acts as a mediator between two slices of state. AppState, and GraphState.
// graphSlice cannot 'see' the appStateSlice, the middleware can see both and transact between the two.
export const historyMiddleware = (startListening: AppStartListening) => {

	startListening({
		predicate: (action, currentState, previousState) => {
			// deep compare of previous state added mostly due to potential state triggers from laying on backspace when deleting meters or groups.
			return isHistoryTrigger(action) && !_.isEqual(currentState.graph, previousState.graph)
		}
		,
		effect: (_action, { dispatch, getState }) => {
			dispatch(updateHistory(getState().graph))
		}
	})

	// Listen for calls to traverse history forward or backwards
	startListening({
		matcher: isAnyOf(forwardHistory, prevHistory, clearHistory),
		effect: (_action, { dispatch, getState }) => {
			// History Stack logic written such that after prev,or next, is executed, the history to set is the top of the backStack
			const graphStateHistory = selectBackHistoryTop(getState())
			dispatch(setGraphState(graphStateHistory))
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
			setGraphState.match(action)
		))
)