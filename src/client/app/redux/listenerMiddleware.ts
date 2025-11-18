/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// listenerMiddleware.ts
// https://redux-toolkit.js.org/api/createListenerMiddleware#typescript-usage
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';
import { graphHistoryListener } from './middleware/graphHistoryMiddleware';
import { unauthorizedRequestListener } from './middleware/unauthorizedAccesMiddleware';

export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>();
export const addAppListener = addListener.withTypes<RootState, AppDispatch>();
export type AppListener = typeof startAppListening;

graphHistoryListener(startAppListening);
unauthorizedRequestListener(startAppListening);
