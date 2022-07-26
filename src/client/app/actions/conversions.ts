/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';
import * as t from '../types/redux/conversions';
import { conversionsApi } from '../utils/api';

export function requestConversionsDetails(): t.RequestConversionsDetailsAction {
	return { type: ActionType.RequestConversionsDetails };
}

export function receiveConversionsDetails(data: t.ConversionData[]): t.ReceiveConversionsDetailsAction {
	return { type: ActionType.ReceiveConversionsDetails, data };
}

export function fetchConversionsDetails(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// ensure a fetch is not currently happening
		if (!getState().conversions.isFetching)
		{
			// set isFetching to true
			dispatch(requestConversionsDetails());
			// attempt to retrieve conversions details from database
			const conversions = await conversionsApi.getConversionsDetails();
			// update the state with the conversions details and set isFetching to false
			dispatch(receiveConversionsDetails(conversions));
			// If this is the first fetch, inform the store that the first fetch has been made
			if (!getState().conversions.hasBeenFetchedOnce)
			{
				dispatch(confirmConversionsFetchedOnce());
			}
		}
	}
}

export function changeDisplayedConversions(conversions: number[]): t.ChangeDisplayedConversionsAction {
	return { type: ActionType.ChangeDisplayedConversions, selectedConversions: conversions };
}

// Pushes conversionIds onto submitting conversions state array
export function submitConversionEdits(sourceId: number, destinationId: number): t.SubmitEditedConversionAction {
	return { type: ActionType.SubmitEditedConversion, sourceId, destinationId};
}

export function confirmConversionEdits(editedConversion: t.ConversionData): t.ConfirmEditedConversionAction {
	return { type: ActionType.ConfirmEditedConversion, editedConversion };
}

export function deleteSubmittedConversion(sourceId: number, destinationId: number): t.DeleteSubmittedConversionAction {
	return {type: ActionType.DeleteSubmittedConversion, sourceId, destinationId}
}

export function confirmConversionsFetchedOnce(): t.ConfirmConversionsFetchedOnceAction {
	return { type: ActionType.ConfirmConversionsFetchedOnce };
}

// Fetch the conversions details from the database if they have not already been fetched once
export function fetchConversionsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		// If conversions have not been fetched once, return the fetchConversionDetails function
		if (!getState().conversions.hasBeenFetchedOnce)
		{
			return dispatch(fetchConversionsDetails());
		}
		// If conversions have already been fetched, return a resolved promise
		return Promise.resolve();
	};
}

export function submitEditedConversion(editedConversion: t.ConversionData): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// check if conversionData is already submitting (indexOf returns -1 if item does not exist in array)

		// TODO: change if statement so it checks that combination of source/destination IDs do not already exist
		// if (getState().conversions.submitting.indexOf(editedConversion.sourceId) === -1 ||
		// 	getState().conversions.submitting.indexOf(editedConversion.destinationId) === -1) {

		// TODO: Above 4 lines might need to be uncommented to make sure submissions are not already submitting

		// Inform the store we are about to edit the passed in conversion
		// Pushes conversionId of the conversionData to submit onto the submitting state array
		dispatch(submitConversionEdits(editedConversion.sourceId, editedConversion.destinationId));

		// Attempt to edit the conversion in the database
		try {
			// posts the edited conversionData to the conversions API
			await conversionsApi.edit(editedConversion);
			// Clear conversion Id from submitting state array
			dispatch(deleteSubmittedConversion(editedConversion.sourceId, editedConversion.destinationId));
			// Update the store with our new edits
			dispatch(confirmConversionEdits(editedConversion));
			// Success!
			showSuccessNotification(translate('conversion.successfully.edited.conversion'));
		} catch (err) {
			// Failure! ):
			showErrorNotification(translate('conversion.failed.to.edit.conversion'));
			// Clear our changes from to the submitting conversions state
			// We must do this in case fetch failed to keep the store in sync with the database
			dispatch(deleteSubmittedConversion(editedConversion.sourceId, editedConversion.destinationId));
		}
	}
	// };
}

// Add conversion to database
export function addConversion(conversion: t.ConversionData): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			// Attempt to add conversion to database
			await conversionsApi.addConversion(conversion);
			// Update the conversions state from the database on a successful call
			// In the future, getting rid of this database fetch and updating the store on a successful API call would make the page faster
			// However, since the database currently assigns the id to the ConversionData
			dispatch(fetchConversionsDetails());
			showSuccessNotification(translate('conversion.successfully.create.conversion'));
		} catch (err) {
			showErrorNotification(translate('conversion.failed.to.create.conversion'));
		}
	}
}