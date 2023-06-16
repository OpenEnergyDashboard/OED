/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';
import * as t from '../types/redux/conversions';
import { conversionsApi } from '../utils/api';
import { updateCikAndDBViewsIfNeeded } from './admin';

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/require-returns */

export function requestConversionsDetails(): t.RequestConversionsDetailsAction {
	return { type: ActionType.RequestConversionsDetails };
}

export function receiveConversionsDetails(data: t.ConversionData[]): t.ReceiveConversionsDetailsAction {
	return { type: ActionType.ReceiveConversionsDetails, data };
}

export function fetchConversionsDetails(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// ensure a fetch is not currently happening
		if (!getState().conversions.isFetching) {
			// set isFetching to true
			dispatch(requestConversionsDetails());
			// attempt to retrieve conversions details from database
			const conversions = await conversionsApi.getConversionsDetails();
			// update the state with the conversions details and set isFetching to false
			dispatch(receiveConversionsDetails(conversions));
			// If this is the first fetch, inform the store that the first fetch has been made
			if (!getState().conversions.hasBeenFetchedOnce) {
				dispatch(confirmConversionsFetchedOnce());
			}
		}
	}
}

export function changeDisplayedConversions(conversions: number[]): t.ChangeDisplayedConversionsAction {
	return { type: ActionType.ChangeDisplayedConversions, selectedConversions: conversions };
}

/**
 * Pushes ConversionData onto submitting conversions state array
 */
export function submitConversionEdits(conversionData: t.ConversionData): t.SubmitEditedConversionAction {
	return { type: ActionType.SubmitEditedConversion, conversionData};
}

export function confirmConversionEdits(editedConversion: t.ConversionData): t.ConfirmEditedConversionAction {
	return { type: ActionType.ConfirmEditedConversion, editedConversion };
}

/**
 * Removes ConversionData from submitting state array
 */
export function deleteSubmittedConversion(conversionData: t.ConversionData): t.DeleteSubmittedConversionAction {
	return {type: ActionType.DeleteSubmittedConversion, conversionData}
}

export function confirmConversionsFetchedOnce(): t.ConfirmConversionsFetchedOnceAction {
	return { type: ActionType.ConfirmConversionsFetchedOnce };
}

/**
 * Removes the passed ConversionData from the store
 */
export function confirmDeletedConversion(conversionData: t.ConversionData): t.DeleteConversionAction {
	return { type: ActionType.DeleteConversion, conversionData }
}

/**
 * Fetch the conversions details from the database if they have not already been fetched once
 */
export function fetchConversionsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		// If conversions have not been fetched once, return the fetchConversionDetails function
		if (!getState().conversions.hasBeenFetchedOnce) {
			return dispatch(fetchConversionsDetails());
		}
		// If conversions have already been fetched, return a resolved promise
		return Promise.resolve();
	};
}

export function submitEditedConversion(editedConversion: t.ConversionData, shouldRedoCik: boolean): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// check if conversionData is already submitting (indexOf returns -1 if item does not exist in array)

		// Search the array of ConversionData in submitting for an object with source/destination ids matching that editedConversion
		const conversionDataIndex = getState().conversions.submitting.findIndex(conversionData => ((
			conversionData.sourceId === editedConversion.sourceId) &&
			conversionData.destinationId === editedConversion.destinationId));

		// If the editedConversion is not already being submitted
		if (conversionDataIndex === -1) {
			// Inform the store we are about to edit the passed in conversion
			// Pushes edited conversionData to submit onto the submitting state array
			dispatch(submitConversionEdits(editedConversion));
			// Attempt to edit the conversion in the database
			try {
				// posts the edited conversionData to the conversions API
				await conversionsApi.edit(editedConversion);
				dispatch(updateCikAndDBViewsIfNeeded(shouldRedoCik, false));
				// Update the store with our new edits
				dispatch(confirmConversionEdits(editedConversion));
				// Success!
				showSuccessNotification(translate('conversion.successfully.edited.conversion'));
			} catch (err) {
				// Failure! ):
				showErrorNotification(translate('conversion.failed.to.edit.conversion') + ' "' + err.response.data as string + '"');
			}
			// Clear conversionData object from submitting state array
			dispatch(deleteSubmittedConversion(editedConversion));
		}
	};
}

// Add conversion to database
export function addConversion(conversion: t.ConversionData): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			// Attempt to add conversion to database
			await conversionsApi.addConversion(conversion);
			// Adding a new conversion only affects the Cik table
			dispatch(updateCikAndDBViewsIfNeeded(true, false));
			// Update the conversions state from the database on a successful call
			// In the future, getting rid of this database fetch and updating the store on a successful API call would make the page faster
			// However, since the database currently assigns the id to the ConversionData we fetch from DB.
			dispatch(fetchConversionsDetails());
			showSuccessNotification(translate('conversion.successfully.create.conversion'));
		} catch (err) {
			showErrorNotification(translate('conversion.failed.to.create.conversion') + ' "' + err.response.data as string + '"');
		}
	}
}

// Delete conversion from database
export function deleteConversion(conversion: t.ConversionData): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// Ensure the conversion is not already being worked on
		// Search the array of ConversionData in submitting for an object with source/destination ids matching that conversion
		const conversionDataIndex = getState().conversions.submitting.findIndex(conversionData => ((
			conversionData.sourceId === conversion.sourceId) &&
			conversionData.destinationId === conversion.destinationId));

		// If the conversion is not already being worked on
		if (conversionDataIndex === -1) {
			// Inform the store we are about to work on this conversion
			// Update the submitting state array
			dispatch(submitConversionEdits(conversion));
			try {
				// Attempt to delete the conversion from the database
				await conversionsApi.delete(conversion);
				// Deleting a conversion only affects the Cik table
				dispatch(updateCikAndDBViewsIfNeeded(true, false));
				// Delete was successful
				// Update the store to match
				dispatch(confirmDeletedConversion(conversion));
				showSuccessNotification(translate('conversion.successfully.delete.conversion'));
			} catch (err) {
				showErrorNotification(translate('conversion.failed.to.delete.conversion') + ' "' + err.response.data as string + '"');
			}
			// Inform the store we are done working with the conversion
			dispatch(deleteSubmittedConversion(conversion));
		}
	}
}