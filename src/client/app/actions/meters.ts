/* eslint-disable */
//@ts-nocheck

/* This Source Code Form is subject to the terms of the Mozilla Public
	* License, v. 2.0. If a copy of the MPL was not distributed with this
	* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Thunk, Dispatch, GetState } from '../types/redux/actions';
import { showSuccessNotification } from '../utils/notifications';
import translate from '../utils/translate';
import * as t from '../types/redux/meters';
import { metersApi } from '../utils/api';
import { updateCikAndDBViewsIfNeeded } from './admin';


export function fetchMetersDetails(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// ensure a fetch is not currently happening
		if (!getState().meters.isFetching) {
			// set isFetching to true
			dispatch(metersSlice.actions.requestMetersDetails());
			// attempt to retrieve meters details from database
			const meters = await metersApi.getMetersDetails();
			// update the state with the meters details and set isFetching to false
			dispatch(metersSlice.actions.receiveMetersDetails(meters));
			// If this is the first fetch, inform the store that the first fetch has been made
			if (!getState().meters.hasBeenFetchedOnce) {
				dispatch(metersSlice.actions.confirmMetersFetchedOnce());
			}
		}
	}
}

// Fetch the meters details from the database if they have not already been fetched once
export function fetchMetersDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		// If meters have not been fetched once, return the fetchMeterDetails function
		if (!getState().meters.hasBeenFetchedOnce) {
			return dispatch(fetchMetersDetails());
		}
		// If meters have already been fetched, return a resolved promise
		return Promise.resolve();
	};
}

export function submitEditedMeter(editedMeter: t.MeterData, shouldRefreshReadingViews: boolean): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// check if meterData is already submitting (indexOf returns -1 if item does not exist in array)
		if (getState().meters.submitting.indexOf(editedMeter.id) === -1) {
			// Inform the store we are about to edit the passed in meter
			// Pushes meterId of the meterData to submit onto the submitting state array
			dispatch(metersSlice.actions.submitEditedMeter(editedMeter.id));

			// Attempt to edit the meter in the database
			try {
				// posts the edited meterData to the meters API
				await metersApi.edit(editedMeter);
				// Update reading views if needed. Never redoCik so false.
				dispatch(updateCikAndDBViewsIfNeeded(false, shouldRefreshReadingViews));
				const changedMeter = await metersApi.edit(editedMeter);
				// Clear meter Id from submitting state array
				dispatch(metersSlice.actions.deleteSubmittedMeter(editedMeter.id));
				// Update the store with our new edits based on what came from DB.
				dispatch(metersSlice.actions.confirmAddMeter(changedMeter));
				// Success!
				showSuccessNotification(translate('meter.successfully.edited.meter'));
			} catch (err) {
				// Failure! ):
				// TODO Better way than popup with React but want to stay so user can read/copy.
				window.alert(translate('meter.failed.to.edit.meter') + '"' + err.response.data as string + '"');
				// Clear our changes from to the submitting meters state
				// We must do this in case fetch failed to keep the store in sync with the database
				dispatch(metersSlice.actions.deleteSubmittedMeter(editedMeter.id));
			}
		}
	};
}

// Add meter to database
export function addMeter(meter: t.MeterData): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			// Attempt to add meter to database
			const meterChanged = await metersApi.addMeter(meter);
			// Update the store with our new edits based on what came from DB.
			// The id and reading frequency may have been updated.
			dispatch(metersSlice.actions.confirmAddMeter(meterChanged));
			showSuccessNotification(translate('meter.successfully.create.meter'));
		} catch (err) {
			// TODO Better way than popup with React but want to stay so user can read/copy.
			window.alert(translate('meter.failed.to.create.meter') + '"' + err.response.data as string + '"');
		}
	}
}
