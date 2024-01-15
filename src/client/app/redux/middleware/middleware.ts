/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// listenerMiddleware.ts
// https://redux-toolkit.js.org/api/createListenerMiddleware#typescript-usage
import { type TypedStartListening, type TypedAddListener, addListener, createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '../../store'
import { historyMiddleware } from './graphHistory'


export type AppStartListening = TypedStartListening<RootState, AppDispatch>
export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>
export const listenerMiddleware = createListenerMiddleware()
// Typescript usage for middleware api
export const startListening = listenerMiddleware.startListening as AppStartListening

historyMiddleware(startListening)