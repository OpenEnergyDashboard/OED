/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as _ from 'lodash';
import { ConversionsAction, ConversionsState } from '../types/redux/conversions';
import { ActionType } from '../types/redux/actions';

const defaultState: ConversionsState = {
	hasBeenFetchedOnce: false,
	isFetching: false,
	selectedConversions: [],
	submitting: [],
	conversions: {}
};

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
				conversions: _.keyBy(action.data, conversion => conversion.sourceId)
			};
		case ActionType.ChangeDisplayedConversions:
			return {
				...state,
				selectedConversions: action.selectedConversions
			};
		case ActionType.SubmitEditedConversion:
		{
			const submitting = state.submitting;
			submitting.push(action.conversionId);
			return {
				...state,
				submitting
			};
		}
		case ActionType.ConfirmEditedConversion:
		{
			// React expects us to return an immutable object in order to invoke a rerender, so we must use spread notation here
			// Overwrite the conversion data at the edited conversion's index with the edited conversion's conversion data
			// The passed in id should be correct as it is inherited from the pre-edited conversion
			// See EditConversionModalComponent line 134 for details (starts with if(conversionHasChanges))
			const conversions = {...state.conversions};
			conversions[action.editedConversion.sourceId] = action.editedConversion;

			return {
				...state,
				conversions
			};
		}
		case ActionType.DeleteSubmittedConversion:
		{
			// Remove the current submitting conversion from the submitting state
			const submitting = state.submitting;
			submitting.splice(submitting.indexOf(action.conversionId));
			return {
				...state,
				submitting
			};
		}
		default:
			return state;
	}
}
