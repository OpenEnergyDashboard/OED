/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { MetersAction, MetersState } from '../types/redux/meters';
import { ActionType } from '../types/redux/actions';

const defaultState: MetersState = {
	isFetching: false,
	byMeterID: {},
	selectedMeters: [],
	editedMeters: {},
	submitting: []
};

export default function meters(state = defaultState, action: MetersAction) {
	let submitting;
	let editedMeters;
	switch (action.type) {
		case ActionType.RequestMetersDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveMetersDetails:
			return {
				...state,
				isFetching: false,
				byMeterID: _.keyBy(action.data, meter => meter.id)
			};
		case ActionType.ChangeDisplayedMeters:
			return {
				...state,
				selectedMeters: action.selectedMeters
			};
		case ActionType.EditMeterDetails:
			editedMeters = state.editedMeters;
			editedMeters[action.meter.id] = action.meter;
			return {
				...state,
				editedMeters
			};
		case ActionType.SubmitEditedMeter:
			submitting = state.submitting;
			submitting.push(action.meter);
			return {
				...state,
				submitting
			};
		case ActionType.ConfirmEditedMeter:
			submitting = state.submitting;
			submitting.splice(submitting.indexOf(action.meter));

			const byMeterID = state.byMeterID;
			editedMeters = state.editedMeters;
			byMeterID[action.meter] = editedMeters[action.meter];

			delete editedMeters[action.meter];
			return {
				...state,
				submitting,
				editedMeters,
				byMeterID
			};
		default:
			return state;
	}
}
