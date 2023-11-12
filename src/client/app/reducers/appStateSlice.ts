import { createSlice } from '@reduxjs/toolkit';
import { GraphState } from '../types/redux/graph';
interface appStateSlice {
	initComplete: boolean;
	backHistoryStack: GraphState[];
	forwardHistoryStack: GraphState[];
}

const defaultState: appStateSlice = {
	initComplete: false,
	backHistoryStack: [],
	forwardHistoryStack: []
}

export const appStateSlice = createSlice({
	name: 'appState',
	initialState: defaultState,
	reducers: create => ({
		// New way of creating reducers as of RTK 2.0
		// Allows thunks inside of reducers, and prepareReducers with 'create' builder notation
		setInitComplete: create.reducer<boolean>((state, action) => {
			state.initComplete = action.payload
		}),
		updateHistory: create.reducer<GraphState>((state, action) => {
			state.backHistoryStack.push(action.payload)
			// reset forward history on new 'visit'
			state.forwardHistoryStack.length = 0

		}),
		prevHistory: create.reducer<void>(state => {
			if (state.backHistoryStack.length > 1) {
				// prev and forward can safely use type assertion due to length check. pop() Will never be undefined
				state.forwardHistoryStack.push(state.backHistoryStack.pop() as GraphState)
			}
		}),
		forwardHistory: create.reducer<void>(state => {
			if (state.forwardHistoryStack.length) {
				state.backHistoryStack.push(state.forwardHistoryStack.pop() as GraphState)
			}
		}),
		clearHistory: create.reducer<void>(state => {
			// TODO Verify the behavior of clear before adding an onClick
			state.forwardHistoryStack.length = 0
			state.backHistoryStack.splice(0, state.backHistoryStack.length - 1)
		})
	}),
	selectors: {
		selectBackHistoryStack: state => state.backHistoryStack,
		selectForwardHistoryStack: state => state.forwardHistoryStack,
		// Explicit return value required when calling sameSlice's getSelectors, otherwise circular type inference breaks TS.
		selectBackHistoryTop: (state): GraphState => {
			const { selectBackHistoryStack } = appStateSlice.getSelectors()
			const backHistory = selectBackHistoryStack(state)
			const top = backHistory[backHistory.length - 1]
			return top
		}
	}
})

export const {
	updateHistory,
	prevHistory,
	forwardHistory,
	setInitComplete,
	clearHistory
} = appStateSlice.actions

export const {
	selectBackHistoryStack,
	selectForwardHistoryStack,
	selectBackHistoryTop
} = appStateSlice.selectors
