/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { getToken } from '../utils/token';
import { ChartTypes } from '../types/redux/graph';
import { PreferenceRequestItem } from '../types/items';
import { ActionType, Dispatch, GetState, State, Thunk } from '../types/redux';
import * as t from '../types/redux/admin';

export function updateDisplayTitle(displayTitle: string): t.UpdateDisplayTitleAction {
	return { type: ActionType.UpdateDisplayTitle, displayTitle };
}

export function updateDefaultChartToRender(defaultChartToRender: ChartTypes): t.UpdateDefaultChartToRenderAction {
	return { type: ActionType.UpdateDefaultChartToRender, defaultChartToRender };
}

export function toggleDefaultBarStacking(): t.ToggleDefaultBarStackingAction {
	return { type: ActionType.ToggleDefaultBarStacking };
}

function requestPreferences(): t.RequestPreferencesAction {
	return { type: ActionType.RequestPreferences };
}

function receivePreferences(data: PreferenceRequestItem): t.ReceivePreferencesAction {
	return { type: ActionType.ReceivePreferences, data };
}

function markPreferencesNotSubmitted(): t.MarkPreferencesNotSubmittedAction {
	return { type: ActionType.MarkPreferencesNotSubmitted };
}

function markPreferencesSubmitted(): t.MarkPreferencesSubmittedAction {
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
