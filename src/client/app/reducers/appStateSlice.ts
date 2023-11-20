import { createSlice } from '@reduxjs/toolkit';
interface appStateSlice {
	initComplete: boolean;
}

const defaultState: appStateSlice = {
	initComplete: false
}

export const appStateSlice = createSlice({
	name: 'appState',
	initialState: defaultState,
	reducers: create => ({
		// New way of creating reducers as of RTK 2.0
		// Allows thunks inside of reducers, and prepareReducers with 'create' builder notation
		setInitComplete: create.reducer<boolean>((state, action) => {
			state.initComplete = action.payload
		})
	}),
	selectors: {
		selectInitComplete: state => state.initComplete
	}
})

export const {
	setInitComplete
} = appStateSlice.actions

export const {
	selectInitComplete
} = appStateSlice.selectors
