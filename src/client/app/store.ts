/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { configureStore } from '@reduxjs/toolkit';
import { setGlobalDevModeChecks } from 'reselect';
import { baseApi } from './redux/api/baseApi';
import { devToolsConfig } from './redux/devToolConfig';
import { listenerMiddleware } from './redux/listenerMiddleware';
import { rootReducer } from './redux/rootReducer';

export const store = configureStore({
	reducer: rootReducer,
	middleware: getDefaultMiddleware => getDefaultMiddleware({
		// immutableCheck: false,
		serializableCheck: false
	}).prepend(listenerMiddleware.middleware)
		.concat(baseApi.middleware),
	devTools: devToolsConfig

});

// stability check for ALL createSelector instances.
setGlobalDevModeChecks({ inputStabilityCheck: 'always', identityFunctionCheck: 'always' });

// Infer the `RootState` and `AppDispatch` types from the store itself
// https://react-redux.js.org/using-react-redux/usage-with-typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch


/**
 * The type of the redux-thunk getState function.
 * TODO verify if applicable to RTK (should be? for getState in RTKQ lifecycle thunks, and CreateAsyncThunk?)
 */
export type GetState = () => RootState;
