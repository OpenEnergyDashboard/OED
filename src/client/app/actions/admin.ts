/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { Dispatch, GetState, Thunk } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { conversionArrayApi, preferencesApi } from '../utils/api';
import translate from '../utils/translate';
import * as moment from 'moment';
import { updateSelectedLanguage } from './options';
import { graphSlice } from '../reducers/graph';
import { adminSlice } from '../reducers/admin';

/**
 * Dispatches a fetch for admin preferences and sets the state based upon the result
 */
function fetchPreferences(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		dispatch(adminSlice.actions.requestPreferences());
		const preferences = await preferencesApi.getPreferences();
		dispatch(adminSlice.actions.receivePreferences(preferences));
		moment.locale(getState().admin.defaultLanguage);
		//  TODO reference only DELETE ME
		// if (!getState().graph.hotlinked) {
		// hotlink removed in rtk migration
		dispatch((dispatch2: Dispatch) => {
			const state = getState();
			dispatch2(graphSlice.actions.changeChartToRender(state.admin.defaultChartToRender));
			if (preferences.defaultBarStacking !== state.graph.barStacking) {
				dispatch2(graphSlice.actions.changeBarStacking());
			}
			if (preferences.defaultAreaNormalization !== state.graph.areaNormalization) {
				dispatch2(graphSlice.actions.toggleAreaNormalization());
			}
			if (preferences.defaultLanguage !== state.options.selectedLanguage) {
				// if the site default differs from the selected language, update the selected language and the locale
				dispatch2(updateSelectedLanguage(preferences.defaultLanguage));
				moment.locale(preferences.defaultLanguage);
			} else {
				// else set moment locale to site default
				moment.locale(getState().admin.defaultLanguage);
			}
		});
		// }
	};
}
// TODO: Add warning for invalid data in admin panel src/client/app/components/admin/PreferencesComponent.tsx
/*  Validates preferences
	Create Preferences Validation:
	Mininum Value cannot bigger than Maximum Value
	Minimum Value and Maximum Value must be between valid input
	Minimum Date and Maximum cannot be blank
	Minimum Date cannot be after Maximum Date
	Minimum Date and Maximum Value must be between valid input
	Maximum No of Error must be between 0 and valid input
*/

function validPreferences(state: State) {
	const MIN_VAL = Number.MIN_SAFE_INTEGER;
	const MAX_VAL = Number.MAX_SAFE_INTEGER;
	const MIN_DATE_MOMENT = moment(0).utc();
	const MAX_DATE_MOMENT = moment(0).utc().add(5000, 'years');
	const MAX_ERRORS = 75;
	if (state.admin.defaultMeterReadingGap >= 0 &&
		state.admin.defaultMeterMinimumValue >= MIN_VAL &&
		state.admin.defaultMeterMinimumValue <= state.admin.defaultMeterMaximumValue &&
		state.admin.defaultMeterMinimumValue <= MAX_VAL &&
		state.admin.defaultMeterMinimumDate !== '' &&
		state.admin.defaultMeterMaximumDate !== '' &&
		moment(state.admin.defaultMeterMinimumDate).isValid() &&
		moment(state.admin.defaultMeterMaximumDate).isValid() &&
		moment(state.admin.defaultMeterMinimumDate).isSameOrAfter(MIN_DATE_MOMENT) &&
		moment(state.admin.defaultMeterMinimumDate).isSameOrBefore(moment(state.admin.defaultMeterMaximumDate)) &&
		moment(state.admin.defaultMeterMaximumDate).isSameOrBefore(MAX_DATE_MOMENT) &&
		(state.admin.defaultMeterMaximumErrors >= 0 && state.admin.defaultMeterMaximumErrors <= MAX_ERRORS)) {
		return true;
	} else {
		return false;
	}
}
/**
 * Submits preferences stored in the state to the API to be stored in the database
 */
export function submitPreferences() {
	return async (dispatch: Dispatch, getState: GetState) => {
		const state = getState();
		try {
			if (!validPreferences(state)) {
				throw new Error('invalid input');
			}
			const preferences = await preferencesApi.submitPreferences({
				displayTitle: state.admin.displayTitle,
				defaultChartToRender: state.admin.defaultChartToRender,
				defaultBarStacking: state.admin.defaultBarStacking,
				defaultLanguage: state.admin.defaultLanguage,
				defaultTimezone: state.admin.defaultTimezone,
				defaultWarningFileSize: state.admin.defaultWarningFileSize,
				defaultFileSizeLimit: state.admin.defaultFileSizeLimit,
				defaultAreaNormalization: state.admin.defaultAreaNormalization,
				defaultAreaUnit: state.admin.defaultAreaUnit,
				defaultMeterReadingFrequency: state.admin.defaultMeterReadingFrequency,
				defaultMeterMinimumValue: state.admin.defaultMeterMinimumValue,
				defaultMeterMaximumValue: state.admin.defaultMeterMaximumValue,
				defaultMeterMinimumDate: state.admin.defaultMeterMinimumDate,
				defaultMeterMaximumDate: state.admin.defaultMeterMaximumDate,
				defaultMeterReadingGap: state.admin.defaultMeterReadingGap,
				defaultMeterMaximumErrors: state.admin.defaultMeterMaximumErrors,
				defaultMeterDisableChecks: state.admin.defaultMeterDisableChecks,
				defaultHelpUrl: state.admin.defaultHelpUrl
			});
			// Only return the defaultMeterReadingFrequency because the value from the DB
			// generally differs from what the user input so update state with DB value.
			dispatch(adminSlice.actions.markPreferencesSubmitted(preferences.defaultMeterReadingFrequency));
			showSuccessNotification(translate('updated.preferences'));
		} catch (e) {
			dispatch(adminSlice.actions.markPreferencesNotSubmitted());
			showErrorNotification(translate('failed.to.submit.changes'));
		}
	};
}

/**
 * @param state The redux state.
 * @returns Whether preferences are fetching
 */
function shouldFetchPreferenceData(state: State): boolean {
	return !state.admin.isFetching;
}

/**
 * @param state The redux state.
 * @returns Whether preferences are submitted
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


/**
 * @param state The redux state.
 * @returns Whether or not the Cik and views are updating
 */
function shouldUpdateCikAndDBViews(state: State): boolean {
	return !state.admin.isUpdatingCikAndDBViews;
}

/**
 * Redo Cik and/or refresh reading views.
 * This function is called when some changes in units/conversions affect the Cik table or reading views.
 * @param shouldRedoCik Whether to refresh Cik.
 * @param shouldRefreshReadingViews Whether to refresh reading views.
 */
export function updateCikAndDBViewsIfNeeded(shouldRedoCik: boolean, shouldRefreshReadingViews: boolean): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		if (shouldUpdateCikAndDBViews(getState())) {
			// set the page to a loading state
			dispatch(adminSlice.actions.toggleWaitForCikAndDB());
			await conversionArrayApi.refresh(shouldRedoCik, shouldRefreshReadingViews);
			// revert to normal state once refresh is complete
			dispatch(adminSlice.actions.toggleWaitForCikAndDB());
			if (shouldRedoCik || shouldRefreshReadingViews) {
				// Only reload window if redoCik and/or refresh reading views.
				window.location.reload();
			}
		}
		return Promise.resolve();
	};
}
