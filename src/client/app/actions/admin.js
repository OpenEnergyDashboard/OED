/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import axios from 'axios';
import { changeBarStacking, changeChartToRender } from './graph';

export const UPDATE_DISPLAY_TITLE = 'UPDATE_DISPLAY_TITLE';
export const UPDATE_DEFAULT_CHART_TO_RENDER = 'UPDATE_DEFAULT_CHART_TO_RENDER';
export const TOGGLE_DEFAULT_BAR_STACKING = 'TOGGLE_DEFAULT_BAR_STACKING';
export const REQUEST_PREFERENCES = 'REQUEST_PREFERENCES';
export const RECEIVE_PREFERENCES = 'RECEIVE_PREFERENCES';

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

function fetchPreferences() {
	return dispatch => {
		dispatch(requestPreferences());
		return axios.get('/api/preferences')
			.then(response => {
				dispatch(receivePreferences(response.data));
				dispatch((dispatch2, getState) => {
					const state = getState();
					dispatch2(changeChartToRender(state.admin.defaultChartToRender));
					if (response.data.defaultBarStacking !== state.graph.barStacking) {
						dispatch2(changeBarStacking());
					}
				});
			});
	};
}

function shouldFetchMetersData(state) {
	return !state.admin.isFetching;
}

export function fetchPreferencesIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchMetersData(getState())) {
			return dispatch(fetchPreferences());
		}
		return Promise.resolve();
	};
}
