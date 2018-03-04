/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { ChartTypes } from '../types/redux/graph';
import { PreferenceRequestItem } from '../types/items';
import * as t from '../types/redux/admin';
import { ActionType, Dispatch, GetState, Thunk } from '../types/redux/actions';
import { State } from '../types/redux/state';
import {preferencesApi} from '../utils/api';


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
	return async (dispatch: Dispatch, getState: GetState) => {
		dispatch(requestPreferences());
		const preferences = await preferencesApi.getPreferences();
		dispatch(receivePreferences(preferences));
		if (!getState().graph.hotlinked) {
			dispatch((dispatch2: Dispatch, getState2: GetState) => {
				const state = getState();
				dispatch2(changeChartToRender(state.admin.defaultChartToRender));
				if (preferences.defaultBarStacking !== state.graph.barStacking) {
					dispatch2(changeBarStacking());
				}
			});
		}
	};
}

function submitPreferences() {
	return async (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		try {
			await preferencesApi.submitPreferences({
				displayTitle: state.admin.displayTitle,
				defaultChartToRender: state.admin.defaultChartToRender,
				defaultBarStacking: state.admin.defaultBarStacking
			});
			dispatch(markPreferencesSubmitted());
			showSuccessNotification('Updated preferences');
		} catch (e) {
			dispatch(markPreferencesNotSubmitted());
			showErrorNotification('Failed to submit changes');
		}
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
