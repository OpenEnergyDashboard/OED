/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ConversionActions, ConversionsState} from '../types/redux/conversions'
import { ActionType } from '../types/redux/actions';

import { Conversion } from 'types/items';


const defaultState: ConversionsState = {
	isFetching: false,
	conversion: [],
	editedConversions: [],
	submitting: []
}

export default function conversions(state = defaultState, action: ConversionActions) {
	let submitting;
	let editedConversions;
	let conversion;
	let finder;
	let index1;
	let index2;
	switch (action.type) {
		case ActionType.RequestConversionDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveConversionDetails:
			return {
				...state,
				isFetching: false,
				conversion: action.data
			};
		case ActionType.EditConversionDetails:
			editedConversions = state.editedConversions;
			editedConversions.push(action.conversion);
			return {
				...state,
				editedConversions
			};
		case ActionType.SubmitEditedConversion:
			submitting = state.submitting;
			submitting.push(action.conversion);
			return {
				...state,
				submitting
			};
		case ActionType.ConfirmEditedConversion:
			submitting = state.submitting;
			submitting.splice(submitting.indexOf(action.conversion));
			conversion = state.conversion;
			editedConversions = state.editedConversions;
			finder = (element: Conversion) => element.sourceId === action.conversion.sourceId && element.destinationId === action.conversion.destinationId;
			index1 = conversion.findIndex(finder);
			index2 = editedConversions.findIndex(finder);
			conversion[index1] = editedConversions[index2];
			finder = (element: Conversion) => element.sourceId !== action.conversion.sourceId && element.destinationId !== action.conversion.destinationId;
			editedConversions = editedConversions.filter(finder);

			return {
				...state,
				submitting,
				editedConversions,
				conversion
			};
		case ActionType.DeleteConversion:
			finder = (element: Conversion) => (
				!((element.sourceId === action.conversion.sourceId) && (element.destinationId === action.conversion.destinationId))
			);
			conversion = state.conversion;
			conversion = conversion.filter(finder)
			return {
				...state,
				conversion
			};
		case ActionType.NewConversion:
			conversion = state.conversion;
			conversion = [
				...conversion,
				action.conversion
			]
			return {
				...state,
				conversion
			}

		default:
			return state;
	}
}

