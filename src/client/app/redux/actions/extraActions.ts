/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createAction } from '@reduxjs/toolkit';
import { GraphState } from 'types/redux/graph';

export const historyStepBack = createAction('graph/historyStepBack');
export const historyStepForward = createAction('graph/historyStepForward');
export const updateHistory = createAction<GraphState>('graph/updateHistory');
export const processGraphLink = createAction<URLSearchParams>('graph/graphLink');
export const clearGraphHistory = createAction('graph/clearHistory');
