// https://redux-toolkit.js.org/api/createListenerMiddleware#typescript-usage
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
	graphSlice,
	nextHistory,
	prevHistory,
	setHotlinked,
	setOptionsVisibility,
	toggleOptionsVisibility,
	updateHistory
} from '../../reducers/graph'
import { AppStartListening } from './middleware'

export const historyMiddleware = createListenerMiddleware()
// Typescript usage for middleware api
const startHistoryListening = historyMiddleware.startListening as AppStartListening

startHistoryListening({
	matcher: isAnyOf(
		// listen to all graphSlice actions, filter out the ones don't directly alter the graph, or ones which can cause infinite recursion
		// we use updateHistory here, so listening for updateHistory would cause infinite loops etc.
		...Object.values(graphSlice.actions)
			.filter(action => !(
				action === nextHistory ||
				action === prevHistory ||
				action === updateHistory ||
				action === toggleOptionsVisibility ||
				action === setOptionsVisibility ||
				action === setHotlinked
			)
			)
	),
	effect: (_action, { dispatch, getState }) => {
		const { graph } = getState();
		dispatch(updateHistory(graph))
	}
})
