/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { getToken } from '../utils/token';
import { chartTypes } from '../reducers/graph';
import { NamedIDItem } from '../types/items';
import { Dispatch, GetState, Thunk } from '../types/redux';

export interface UpdateDisplayTitleAction {
	type: 'UPDATE_DISPLAY_TITLE';
	displayTitle: string;
}

export interface UpdateDefaultChartToRenderAction {
	type: 'UPDATE_DEFAULT_CHART_TO_RENDER';
	defaultChartToRender: chartTypes;
}

export interface ToggleDefaultBarStackingAction {
	type: 'TOGGLE_DEFAULT_BAR_STACKING';
}

export interface RequestPreferencesAction {
	type: 'REQUEST_PREFERENCES';
}

export interface ReceivePreferencesAction {
	type: 'RECEIVE_PREFERENCES';
	data: NamedIDItem[]; // TODO is this right?
}

export interface MarkPreferencesNotSubmittedAction {
	type: 'MARK_PREFERENCES_NOT_SUBMITTED';
}

export interface MarkPreferencesSubmittedAction {
	type: 'MARK_PREFERENCES_SUBMITTED';
}

export function updateDisplayTitle(displayTitle: string): UpdateDisplayTitleAction {
	return { type: UPDATE_DISPLAY_TITLE, displayTitle };
}

export function updateDefaultChartToRender(defaultChartToRender: chartTypes): UpdateDefaultChartToRenderAction {
	return { type: UPDATE_DEFAULT_CHART_TO_RENDER, defaultChartToRender };
}

export function toggleDefaultBarStacking(): ToggleDefaultBarStackingAction {
	return { type: TOGGLE_DEFAULT_BAR_STACKING };
}

function requestPreferences(): RequestPreferencesAction {
	return { type: REQUEST_PREFERENCES };
}

function receivePreferences(data: NamedIDItem[]): ReceivePreferencesAction {
	return { type: RECEIVE_PREFERENCES, data };
}

function markPreferencesSubmitted(): MarkPreferencesNotSubmittedAction {
	return { type: MARK_PREFERENCES_SUBMITTED };
}

function markPreferencesNotSubmitted(): MarkPreferencesSubmittedAction {
	return { type: MARK_PREFERENCES_NOT_SUBMITTED };
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

function shouldFetchPreferenceData(state): boolean {
	return !state.admin.isFetching;
}

function shouldSubmitPreferenceData(state): boolean {
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
	return (dispatch: Dispatch, getState: GetSTate) => {
		if (shouldSubmitPreferenceData(getState())) {
			return dispatch(submitPreferences());
		}
		return Promise.resolve();
	};
}
