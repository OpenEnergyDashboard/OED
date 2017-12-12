/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { getToken } from '../utils/token';
import { chartTypes } from '../reducers/graph';
import { PreferenceRequestItem } from '../types/items';
import { ActionType, Dispatch, GetState, State, Thunk } from '../types/redux';

export type AdminAction =
	| UpdateDisplayTitleAction
	| UpdateDefaultChartToRenderAction
	| ToggleDefaultBarStackingAction
	| RequestPreferencesAction
	| ReceivePreferencesAction
	| MarkPreferencesNotSubmittedAction
	| MarkPreferencesSubmittedAction;

export interface UpdateDisplayTitleAction {
	type: ActionType.UpdateDisplayTitle;
	displayTitle: string;
}

export interface UpdateDefaultChartToRenderAction {
	type: ActionType.UpdateDefaultChartToRender;
	defaultChartToRender: chartTypes;
}

export interface ToggleDefaultBarStackingAction {
	type: ActionType.ToggleDefaultBarStacking;
}

export interface RequestPreferencesAction {
	type: ActionType.RequestPreferences;
}

export interface ReceivePreferencesAction {
	type: ActionType.ReceivePreferences;
	data: PreferenceRequestItem;
}

export interface MarkPreferencesNotSubmittedAction {
	type: ActionType.MarkPreferencesNotSubmitted;
}

export interface MarkPreferencesSubmittedAction {
	type: ActionType.MarkPreferencesSubmitted;
}

export function updateDisplayTitle(displayTitle: string): UpdateDisplayTitleAction {
	return { type: ActionType.UpdateDisplayTitle, displayTitle };
}

export function updateDefaultChartToRender(defaultChartToRender: chartTypes): UpdateDefaultChartToRenderAction {
	return { type: ActionType.UpdateDefaultChartToRender, defaultChartToRender };
}

export function toggleDefaultBarStacking(): ToggleDefaultBarStackingAction {
	return { type: ActionType.ToggleDefaultBarStacking };
}

function requestPreferences(): RequestPreferencesAction {
	return { type: ActionType.RequestPreferences };
}

function receivePreferences(data: PreferenceRequestItem): ReceivePreferencesAction {
	return { type: ActionType.ReceivePreferences, data };
}

function markPreferencesNotSubmitted(): MarkPreferencesNotSubmittedAction {
	return { type: ActionType.MarkPreferencesNotSubmitted };
}

function markPreferencesSubmitted(): MarkPreferencesSubmittedAction {
	return { type: ActionType.MarkPreferencesSubmitted };
}


function fetchPreferences(): Thunk {
	return (dispatch: Dispatch) => {
		dispatch(requestPreferences());
		return axios.get('/api/preferences')
			.then(response => {
				dispatch(receivePreferences(response.data));
				dispatch((dispatch2: Dispatch, getState: GetState) => {
					const state = getState();
					dispatch2(changeChartToRender(state.admin.defaultChartToRender));
					if (response.data.defaultBarStacking !== state.graph.barStacking) {
						dispatch2(changeBarStacking());
					}
				});
			});
	};
}

function submitPreferences() {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		dispatch(markPreferencesSubmitted());
		return axios.post('/api/preferences',
			{
				token: getToken(),
				preferences: {
					displayTitle: state.admin.displayTitle,
					defaultChartToRender: state.admin.defaultChartToRender,
					defaultBarStacking: state.admin.defaultBarStacking
				}
			})
			.then(() => {
				showSuccessNotification('Updated preferences');
			})
			.catch(() => {
				dispatch(markPreferencesNotSubmitted());
				showErrorNotification('Failed to submit changes');
			}
		);
	};
}

function shouldFetchPreferenceData(state: State): boolean {
	return !state.admin.isFetching;
}

function shouldSubmitPreferenceData(state: State): boolean {
	return !state.admin.submitted;
}

export function fetchPreferencesIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchPreferenceData(getState())) {
			return dispatch(fetchPreferences());
		}
		return Promise.resolve();
	};
}

export function submitPreferencesIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldSubmitPreferenceData(getState())) {
			return dispatch(submitPreferences());
		}
		return Promise.resolve();
	};
}
