/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { toggleAreaNormalization, changeBarStacking, changeChartToRender } from './graph';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { ChartTypes } from '../types/redux/graph';
import { PreferenceRequestItem } from '../types/items';
import * as t from '../types/redux/admin';
import { ActionType, Dispatch, GetState, Thunk } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { conversionArrayApi, preferencesApi } from '../utils/api';
import translate from '../utils/translate';
import { LanguageTypes } from '../types/redux/i18n';
import * as moment from 'moment';
import { AreaUnitType } from '../utils/getAreaUnitConversion';


export function updateSelectedMeter(meterID: number): t.UpdateImportMeterAction {
	return { type: ActionType.UpdateImportMeter, meterID };
}

export function updateDisplayTitle(displayTitle: string): t.UpdateDisplayTitleAction {
	return { type: ActionType.UpdateDisplayTitle, displayTitle };
}

export function updateTimeZone(timeZone: string): t.UpdateDefaultTimeZone {
	return { type: ActionType.UpdateDefaultTimeZone, timeZone };
}

export function updateDefaultChartToRender(defaultChartToRender: ChartTypes): t.UpdateDefaultChartToRenderAction {
	return { type: ActionType.UpdateDefaultChartToRender, defaultChartToRender };
}

export function toggleDefaultBarStacking(): t.ToggleDefaultBarStackingAction {
	return { type: ActionType.ToggleDefaultBarStacking };
}

export function toggleDefaultAreaNormalization(): t.ToggleDefaultAreaNormalizationAction {
	return { type: ActionType.ToggleDefaultAreaNormalization };
}

export function updateDefaultAreaUnit(defaultAreaUnit: AreaUnitType): t.UpdateDefaultAreaUnitAction {
	return { type: ActionType.UpdateDefaultAreaUnit, defaultAreaUnit };
}

export function updateDefaultLanguage(defaultLanguage: LanguageTypes): t.UpdateDefaultLanguageAction {
	moment.locale(defaultLanguage);
	return { type: ActionType.UpdateDefaultLanguage, defaultLanguage };
}

export function updateDefaultWarningFileSize(defaultWarningFileSize: number): t.UpdateDefaultWarningFileSize {
	return { type: ActionType.UpdateDefaultWarningFileSize, defaultWarningFileSize };
}

export function updateDefaultFileSizeLimit(defaultFileSizeLimit: number): t.UpdateDefaultFileSizeLimit {
	return { type: ActionType.UpdateDefaultFileSizeLimit, defaultFileSizeLimit };
}

export function updateDefaultMeterReadingFrequency(defaultMeterReadingFrequency: string): t.UpdateDefaultMeterReadingFrequencyAction {
	return { type: ActionType.UpdateDefaultMeterReadingFrequency, defaultMeterReadingFrequency };
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

function markPreferencesSubmitted(defaultMeterReadingFrequency: string): t.MarkPreferencesSubmittedAction {
	return { type: ActionType.MarkPreferencesSubmitted, defaultMeterReadingFrequency };
}

function fetchPreferences(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		dispatch(requestPreferences());
		const preferences = await preferencesApi.getPreferences();
		dispatch(receivePreferences(preferences));
		moment.locale(getState().admin.defaultLanguage);
		if (!getState().graph.hotlinked) {
			dispatch((dispatch2: Dispatch) => {
				const state = getState();
				dispatch2(changeChartToRender(state.admin.defaultChartToRender));
				if (preferences.defaultBarStacking !== state.graph.barStacking) {
					dispatch2(changeBarStacking());
				}
				if (preferences.defaultAreaNormalization !== state.graph.areaNormalization) {
					dispatch2(toggleAreaNormalization());
				}
			});
		}
	};
}

export function submitPreferences() {
	return async (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		try {
			const preferences = await preferencesApi.submitPreferences({
				displayTitle: state.admin.displayTitle,
				defaultChartToRender: state.admin.defaultChartToRender,
				defaultBarStacking: state.admin.defaultBarStacking,
				defaultLanguage: state.admin.defaultLanguage,
				defaultTimezone: state.admin.defaultTimeZone,
				defaultWarningFileSize: state.admin.defaultWarningFileSize,
				defaultFileSizeLimit: state.admin.defaultFileSizeLimit,
				defaultAreaNormalization: state.admin.defaultAreaNormalization,
				defaultAreaUnit: state.admin.defaultAreaUnit,
				defaultMeterReadingFrequency: state.admin.defaultMeterReadingFrequency
			});
			// Only return the defaultMeterReadingFrequency because the value from the DB
			// generally differs from what the user input so update state with DB value.
			dispatch(markPreferencesSubmitted(preferences.defaultMeterReadingFrequency));
			showSuccessNotification(translate('updated.preferences'));
		} catch (e) {
			dispatch(markPreferencesNotSubmitted());
			showErrorNotification(translate('failed.to.submit.changes'));
		}
	};
}

/**
 * @param {State} state The redux state.
 * @returns {boolean} Whether preferences are fetching
 */
function shouldFetchPreferenceData(state: State): boolean {
	return !state.admin.isFetching;
}

/**
 * @param {State} state The redux state.
 * @returns {boolean} Whether preferences are submitted
 */
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

function updateCikAndDBViews(): t.UpdateCikAndDBViews {
	return { type: ActionType.UpdateCikAndDBViews };
}

/**
 * @param {State} state The redux state.
 * @returns {boolean} Whether or not the Cik and views are updating
 */
function shouldUpdateCikAndDBViews(state: State): boolean {
	return !state.admin.isUpdatingCikAndDBViews;
}

/**
 * Redo Cik and/or refresh reading views.
 * This function is called when some changes in units/conversions affect the Cik table or reading views.
 * @param {boolean} shouldRedoCik Whether to refresh Cik.
 * @param {boolean} shouldRefreshReadingViews Whether to refresh reading views.
 */
export function updateCikAndDBViewsIfNeeded(shouldRedoCik: boolean, shouldRefreshReadingViews: boolean): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		if (shouldUpdateCikAndDBViews(getState())) {
			dispatch(updateCikAndDBViews());
			await conversionArrayApi.refresh(shouldRedoCik, shouldRefreshReadingViews);
			window.location.reload();
		}
		return Promise.resolve();
	};
}
