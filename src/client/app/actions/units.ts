/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';
import * as t from '../types/redux/units';
import { unitsApi } from '../utils/api';

export function requestUnitsDetails(): t.RequestUnitsDetailsAction {
	return { type: ActionType.RequestUnitsDetails };
}

export function receiveUnitsDetails(data: t.UnitData[]): t.ReceiveUnitsDetailsAction {
	return { type: ActionType.ReceiveUnitsDetails, data };
}

export function fetchUnitsDetails(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// ensure a fetch is not currently happening
		if (!getState().units.isFetching)
		{
			// set isFetching to true
			dispatch(requestUnitsDetails());
			// attempt to retrieve units details from database
			const units = await unitsApi.getUnitsDetails();
			// update the state with the units details and set isFetching to false
			dispatch(receiveUnitsDetails(units));
			// If this is the first fetch, inform the store that the first fetch has been made
			if (!getState().units.hasBeenFetchedOnce)
			{
				dispatch(confirmUnitsFetchedOnce());
			}
		}
	}
}

export function changeDisplayedUnits(units: number[]): t.ChangeDisplayedUnitsAction {
	return { type: ActionType.ChangeDisplayedUnits, selectedUnits: units };
}

export function editUnitDetails(unit: t.UnitData): t.EditUnitDetailsAction {
	return { type: ActionType.EditUnitDetails, unit };
}

export function submitUnitEdits(unit: number): t.SubmitEditedUnitAction {
	return { type: ActionType.SubmitEditedUnit, unit };
}

export function confirmUnitEdits(unitId: number): t.ConfirmEditedUnitAction {
	return { type: ActionType.ConfirmEditedUnit, unitId };
}

export function deleteEditedUnit(unitId: number): t.DeleteEditedUnitAction {
	return {type: ActionType.DeleteEditedUnit, unitId }
}

export function deleteSubmittedUnit(unitId: number): t.DeleteSubmittedUnitAction {
	return {type: ActionType.DeleteSubmittedUnit, unitId}
}

export function confirmUnitsFetchedOnce(): t.ConfirmUnitsFetchedOnceAction {
	return { type: ActionType.ConfirmUnitsFetchedOnce };
}

// Fetch the units details from the database if they have not already been fetched once
export function fetchUnitsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		// If units have not been fetched once, return the fetchUnitDetails function
		if (!getState().units.hasBeenFetchedOnce)
		{
			return dispatch(fetchUnitsDetails());
		}
		// If units have already been fetched, return a resolved promise
		return Promise.resolve();
	};
}

// TODO maybe this can be removed since we're not doing bulk edits
// I imagine this bulk function exists so that you do not need to pass in a unitId when submit an edited unit

export function submitEditedUnits(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// dispatches submitEditedUnit for each unitData in editedUnits (by id) if they are not already submitting
		Object.keys(getState().units.editedUnits).forEach(unitIdS => {
			// grab the unitId
			const unitId = parseInt(unitIdS);
			// check if unitData is already submitting (indexOf returns -1 if item does not exist in array)
			if (getState().units.submitting.indexOf(unitId) === -1) {
				// if unit is not submitting, submit it
				dispatch(submitEditedUnit(unitId));
			}
		});
	};
}

export function submitEditedUnit(unitId: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// retrieve the unitData by id
		const submittingUnit = getState().units.editedUnits[unitId];
		// pushes unitId of the unitData to submit onto the submitting state array
		dispatch(submitUnitEdits(unitId));
		try {
			// posts the edited unitData to the units API
			await unitsApi.edit(submittingUnit);
			// Clear unit Id from submitting state array
			dispatch(deleteSubmittedUnit(unitId));
			// Retrieve our edits from the editedUnits state and overwrite the units state with them
			dispatch(confirmUnitEdits(unitId));
			// Clear our edits from the editedUnits state
			dispatch(deleteEditedUnit(unitId));
			showSuccessNotification(translate('unit.successfully.edited.unit'));
		} catch (err) {
			showErrorNotification(translate('unit.failed.to.edit.unit'));
			// Clear our changes from to the submitting and editedUnits state
			// We must do this in case fetch failed to keep the store in sync with the database
			dispatch(deleteSubmittedUnit(unitId));
			dispatch(deleteEditedUnit(unitId));
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

// Add unit to database
export function addUnit(unit: t.UnitData): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			// Attempt to add unit to database
			await unitsApi.addUnit(unit);
			// Update the units state from the database on a successful call
			// In the future, getting rid of this database fetch and updating the store on a successful API call would make the page faster
			// However, since the database currently assigns the id to the UnitData
			dispatch(fetchUnitsDetails());
			showSuccessNotification(translate('unit.successfully.create.unit'));
		} catch (err) {
			showErrorNotification(translate('unit.failed.to.create.unit'));
		}
	}
}