import { createAction } from '@reduxjs/toolkit';
import { GraphState } from 'types/redux/graph';

export const historyStepBack = createAction('graph/historyStepBack');
export const historyStepForward = createAction('graph/historyStepForward');
export const updateHistory = createAction<GraphState>('graph/updateHistory');
export const processGraphLink = createAction<URLSearchParams>('graph/graphLink');
