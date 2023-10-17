// listenerMiddleware.ts
// https://redux-toolkit.js.org/api/createListenerMiddleware#typescript-usage
import { type TypedStartListening, type TypedAddListener, addListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '../../store'
export type AppStartListening = TypedStartListening<RootState, AppDispatch>
export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>