/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as _ from 'lodash';
import { UnitsAction, UnitsState } from '../types/redux/units';
import { ActionType } from '../types/redux/actions';

const defaultState: UnitsState = {
	isFetching: false,
	selectedUnits: [],
	editedUnits: {},
	submitting: [],
	units: []
};

export default function units(state = defaultState, action: UnitsAction) {
	let submitting;
	let editedUnits;
	switch (action.type) {
		case ActionType.RequestUnitsDetails:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceiveUnitsDetails:
			return {
				...state,
				isFetching: false,
				units: _.keyBy(action.data, unit => unit.id)
			};
		case ActionType.ChangeDisplayedUnits:
			return {
				...state,
				selectedUnits: action.selectedUnits
			};
		case ActionType.EditUnitDetails:
			editedUnits = state.editedUnits;
			editedUnits[action.unit.id] = action.unit;
			return {
				...state,
				editedUnits
			};
		case ActionType.SubmitEditedUnit:
			submitting = state.submitting;
			submitting.push(action.unit);
			return {
				...state,
				submitting
			};
		case ActionType.ConfirmEditedUnit:
		{
			submitting = state.submitting;
			submitting.splice(submitting.indexOf(action.unit));

			const units = state.units;
			editedUnits = state.editedUnits;
			units[action.unit] = editedUnits[action.unit];

			delete editedUnits[action.unit];
			return {
				...state,
				submitting,
				editedUnits,
				units
			};
		}
		default:
			return state;
	}
}
