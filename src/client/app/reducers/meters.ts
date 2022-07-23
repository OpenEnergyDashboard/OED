/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as _ from 'lodash';
import { MetersAction, MetersState } from '../types/redux/meters';
import { ActionType } from '../types/redux/actions';

const defaultState: MetersState = {
	hasBeenFetchedOnce: false,
	isFetching: false,
	byMeterID: {},
	selectedMeters: [],
	submitting: [],
	meters: {}
};

export default function meters(state = defaultState, action: MetersAction) {
	switch (action.type) {
		case ActionType.ConfirmMetersFetchedOnce:
			return {
				...state,
				hasBeenFetchedOnce: true
			};
		case ActionType.RequestMetersDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveMetersDetails:
			return {
				...state,
				isFetching: false,
				meters: _.keyBy(action.data, meter => meter.id),
				byMeterID: _.keyBy(action.data, meter => meter.id)
			};
		case ActionType.ChangeDisplayedMeters:
			return {
				...state,
				selectedMeters: action.selectedMeters
			};
		case ActionType.SubmitEditedMeter:
		{
			const submitting = state.submitting;
			submitting.push(action.meterId);
			return {
				...state,
				submitting
			};
		}
		case ActionType.ConfirmEditedMeter:
		{
			// React expects us to return an immutable object in order to invoke a rerender, so we must use spread notation here
			// Overwrite the meter data at the edited meter's index with the edited meter's meter data
			// The passed in id should be correct as it is inherited from the pre-edited meter
			// See EditMeterModalComponent line 134 for details (starts with if(meterHasChanges))
			const meters = {...state.meters};
			meters[action.editedMeter.id] = action.editedMeter;

			return {
				...state,
				meters
			};
		}
		case ActionType.DeleteSubmittedMeter:
		{
			// Remove the current submitting meter from the submitting state
			const submitting = state.submitting;
			submitting.splice(submitting.indexOf(action.meterId));
			return {
				...state,
				submitting
			};
		}
		default:
			return state;
	}
}
