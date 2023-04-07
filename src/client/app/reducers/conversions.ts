/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ConversionsAction, ConversionsState } from '../types/redux/conversions';
import { ActionType } from '../types/redux/actions';

const defaultState: ConversionsState = {
	hasBeenFetchedOnce: false,
	isFetching: false,
	selectedConversions: [],
	submitting: [],
	conversions: []
};

/* eslint-disable jsdoc/require-jsdoc */

export default function conversions(state = defaultState, action: ConversionsAction) {
	switch (action.type) {
		case ActionType.ConfirmConversionsFetchedOnce:
			return {
				...state,
				hasBeenFetchedOnce: true
			};
		case ActionType.RequestConversionsDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveConversionsDetails:
			return {
				...state,
				isFetching: false,
				conversions: action.data
			};
		case ActionType.ChangeDisplayedConversions:
			return {
				...state,
				selectedConversions: action.selectedConversions
			};
		case ActionType.SubmitEditedConversion: {
			const submitting = state.submitting;
			submitting.push(action.conversionData);
			return {
				...state,
				submitting: [...submitting]
			};
		}
		case ActionType.ConfirmEditedConversion: {
			// Overwrite the conversion data at the edited conversion's index with the edited conversion's conversion data
			// The passed in id should be correct as it is inherited from the pre-edited conversion
			// See EditConversionModalComponent line 134 for details (starts with if(conversionHasChanges))
			const conversions = state.conversions;
			// Search the array of ConversionData in conversions for an object with source/destination ids matching that of the action payload
			const conversionDataIndex = conversions.findIndex(conversionData => ((
				conversionData.sourceId === action.editedConversion.sourceId) &&
				conversionData.destinationId === action.editedConversion.destinationId));
			// Overwrite ConversionData at index with edited ConversionData
			conversions[conversionDataIndex] = action.editedConversion;
			return {
				...state,
				// React expects us to return an immutable object in order to invoke a rerender, so we must use spread notation here
				conversions: [...conversions]
			};
		}
		case ActionType.DeleteSubmittedConversion: {
			// Remove the current submitting conversion from the submitting state
			const submitting = state.submitting;
			// Search the array of ConversionData in submitting for an object with source/destination ids matching that of the action payload
			const conversionDataIndex = submitting.findIndex(conversionData => ((
				conversionData.sourceId === action.conversionData.sourceId) &&
				conversionData.destinationId === action.conversionData.destinationId));
			// Remove the object from the submitting array
			submitting.splice(conversionDataIndex);
			return {
				...state,
				submitting: [...submitting]
			};
		}
		case ActionType.DeleteConversion: {
			// Retrieve conversions state
			const conversions = state.conversions;
			// Search the array of ConversionData in conversions for an object with source/destination ids matching that of the action payload
			const conversionDataIndex = conversions.findIndex(conversionData => ((
				conversionData.sourceId === action.conversionData.sourceId) &&
				conversionData.destinationId === action.conversionData.destinationId));
			// Remove the ConversionData from the conversions array
			conversions.splice(conversionDataIndex);
			// Return a new array of ConversionData without the deleted conversion
			return {
				...state,
				conversions: [...conversions]
			}
		}
		default:
			return state;
	}
}
