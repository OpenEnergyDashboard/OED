/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { getToken } from '../utils/token';
import { ChartTypes } from '../types/redux/graph';
import { PreferenceRequestItem } from '../types/items';
import * as t from '../types/redux/admin';
import { ActionType, Dispatch, GetState, Thunk } from '../types/redux/actions';
import { State } from '../types/redux/state';

export function updateSelectedMeter(meterID: number): t.UpdateImportMeterAction {
	return { type: ActionType.UpdateImportMeter, meterID };
}

export function updateDisplayTitle(displayTitle: string): t.UpdateDisplayTitleAction {
	return { type: ActionType.UpdateDisplayTitle, displayTitle };
}

export function updateDefaultChartToRender(defaultChartToRender: ChartTypes): t.UpdateDefaultChartToRenderAction {
	return { type: ActionType.UpdateDefaultChartToRender, defaultChartToRender };
}

export function toggleDefaultBarStacking(): t.ToggleDefaultBarStackingAction {
	return { type: ActionType.ToggleDefaultBarStacking };
}

export function toggleDefaultHideOptions(): t.ToggleDefaultHideOptionsAction {
	return { type: ActionType.ToggleDefaultHideOptions };
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
	return (dispatch: Dispatch, getState: GetState) => {
		dispatch(requestPreferences());
		return axios.get('/api/preferences')
			.then(response => {
				dispatch(receivePreferences(response.data));
				if (!getState().graph.hotlinked) {
					dispatch((dispatch2: Dispatch, getState2: GetState) => {
						const state = getState();
						dispatch2(changeChartToRender(state.admin.defaultChartToRender));
						if (response.data.defaultBarStacking !== state.graph.barStacking) {
							dispatch2(changeBarStacking());
						}
					});
				}
			});
	};
}

function submitPreferences() {
	return (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		return axios.post('/api/preferences',
			{
				token: getToken(),
				preferences: {
					displayTitle: state.admin.displayTitle,
					defaultChartToRender: state.admin.defaultChartToRender,
					defaultBarStacking: state.admin.defaultBarStacking,
					defaultHideOptions: state.admin.defaultHideOptions
				}
			})
			.then(() => {
				dispatch(markPreferencesSubmitted());
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
