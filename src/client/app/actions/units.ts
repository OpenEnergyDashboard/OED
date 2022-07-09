/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';
import { State } from '../types/redux/state';
import * as t from '../types/redux/units';
import { unitsApi } from '../utils/api';

export function requestUnitsDetails(): t.RequestUnitsDetailsAction {
	return { type: ActionType.RequestUnitsDetails };
}

export function receiveUnitsDetails(data: t.UnitData[]): t.ReceiveUnitsDetailsAction {
	return { type: ActionType.ReceiveUnitsDetails, data };
}

export function fetchUnitsDetails(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestUnitsDetails());
		const units = await unitsApi.getUnitsDetails();
		dispatch(receiveUnitsDetails(units));
	}
}

export function changeDisplayedUnits(units: number[]): t.ChangeDisplayedUnitsAction {
	return { type: ActionType.ChangeDisplayedUnits, selectedUnits: units};
}

export function editUnitDetails(unit: t.UnitData):
t.EditUnitDetailsAction {
	return { type: ActionType.EditUnitDetails, unit };
}

export function submitUnitEdits(unit: number): t.SubmitEditedUnitAction {
	return { type: ActionType.SubmitEditedUnit, unit };
}

export function confirmUnitEdits(unit: number): t.ConfirmEditedUnitAction {
	return { type: ActionType.ConfirmEditedUnit, unit};
}

function shouldFetchUnitsDetails(state: State): boolean {
	return !state.units.isFetching;
}

export function fetchUnitsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (shouldFetchUnitsDetails(getState())) {
			return dispatch(fetchUnitsDetails());
		}
		return Promise.resolve();
	};
}

export function submitEditedUnits(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		Object.keys(getState().units.editedUnits).forEach(unitIdS => { //dispatches submitEditedUnit for each unitData in editedUnits (by id) if they are not already submitting
			const unitId = parseInt(unitIdS); //grab the unitId
			if (getState().units.submitting.indexOf(unitId) === -1) { //check if unitData is already submitting (indexOf returns -1 if item does not exist in array)
				dispatch(submitEditedUnit(unitId)); //if unit is not submitting, submit it 
			}
		});
	};
}

export function submitEditedUnit(unitId: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const submittingUnit = getState().units.editedUnits[unitId]; //retrieve the unitData by id
		dispatch(submitUnitEdits(unitId)); //pushes unitId of the unitData to submit onto the submitting state array
		try {
			await unitsApi.edit(submittingUnit); //posts the edited unitData to the units API 
			dispatch(confirmUnitEdits(unitId)); //removes unit from submitting state array, overwrites unitData in units state array with unitData in editedUnits state array, deletes unitData in editedUnits state array
			showSuccessNotification(translate('successfully.edited.unit'));
		} catch (err) {
			showErrorNotification(translate('failed.to.edit.unit'));
		}
	};
}

/**
 * Remove all the unit in editing without submitting them
 */
export function confirmEditedUnits(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		Object.keys(getState().units.editedUnits).forEach(unitIdS => {
			const unitId = parseInt(unitIdS);
			dispatch(confirmUnitEdits(unitId));
		});
	}
}

//Add unit to database
export function addUnit(unit: t.UnitData): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			await unitsApi.addUnit(unit); //Attempt to add unit to database
			dispatch(fetchUnitsDetails());//Update the units state from the database on a successful call
			showSuccessNotification(translate('successfully.added.unit'));
		} catch (err) {
			showErrorNotification(translate('failed.to.add.unit'));
		}
	}
}