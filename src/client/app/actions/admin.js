/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { getToken } from '../utils/token';

export const UPDATE_IMPORT_METER = 'UPDATE_IMPORT_METER';
export const UPDATE_DISPLAY_TITLE = 'UPDATE_DISPLAY_TITLE';
export const UPDATE_DEFAULT_CHART_TO_RENDER = 'UPDATE_DEFAULT_CHART_TO_RENDER';
export const TOGGLE_DEFAULT_BAR_STACKING = 'TOGGLE_DEFAULT_BAR_STACKING';
export const REQUEST_PREFERENCES = 'REQUEST_PREFERENCES';
export const RECEIVE_PREFERENCES = 'RECEIVE_PREFERENCES';
export const MARK_PREFERENCES_NOT_SUBMITTED = 'MARK_PREFERENCES_NOT_SUBMITTED';
export const MARK_PREFERENCES_SUBMITTED = 'MARK_PREFERENCES_SUBMITTED';

export function updateDisplayTitle(displayTitle) {
	return { type: UPDATE_DISPLAY_TITLE, displayTitle };
}

export function updateDefaultChartToRender(defaultChartToRender) {
	return { type: UPDATE_DEFAULT_CHART_TO_RENDER, defaultChartToRender };
}

export function toggleDefaultBarStacking() {
	return { type: TOGGLE_DEFAULT_BAR_STACKING };
}

function requestPreferences() {
	return { type: REQUEST_PREFERENCES };
}

function receivePreferences(data) {
	return { type: RECEIVE_PREFERENCES, data };
}

function markPreferencesSubmitted() {
	return { type: MARK_PREFERENCES_SUBMITTED };
}

function markPreferencesNotSubmitted() {
	return { type: MARK_PREFERENCES_NOT_SUBMITTED };
}

function fetchPreferences() {
	return (dispatch, getState) => {
		dispatch(requestPreferences());
		return axios.get('/api/preferences')
			.then(response => {
				dispatch(receivePreferences(response.data));
				const state = getState();
				if (!state.graph.hotlinked) {
					dispatch(changeChartToRender(state.admin.defaultChartToRender));
					if (response.data.defaultBarStacking !== state.graph.barStacking) {
						dispatch(changeBarStacking());
					}
				}
			});
	};
}

function submitPreferences() {
	return (dispatch, getState) => {
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

function shouldFetchPreferenceData(state) {
	return !state.admin.isFetching;
}

function shouldSubmitPreferenceData(state) {
	return !state.admin.submitted;
}

export function fetchPreferencesIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchPreferenceData(getState())) {
			return dispatch(fetchPreferences());
		}
		return Promise.resolve();
	};
}

export function submitPreferencesIfNeeded() {
	return (dispatch, getState) => {
		if (shouldSubmitPreferenceData(getState())) {
			return dispatch(submitPreferences());
		}
		return Promise.resolve();
	};
}

export function updateSelectedMeter(meterID) {
	return { type: UPDATE_IMPORT_METER, meterID };
}
