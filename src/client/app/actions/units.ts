/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType, Thunk, Dispatch, GetState } from '../types/redux/actions';
import { showErrorNotification } from '../utils/notifications';
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
		Object.keys(getState().units.editedUnits).forEach(unitIdS => {
			const unitId = parseInt(unitIdS);
			if (getState().units.submitting.indexOf(unitId) === -1) {
				dispatch(submitEditedUnit(unitId));
			}
		});
	};
}

export function submitEditedUnit(unitId: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		//const submittingUnit = getState().units.editedUnits[unitId];
		let submittingUnit = getState().units.editedUnits[unitId];
		console.log("submit edited unit submitting unit ", submittingUnit);
		//submittingUnit.identifier = 'fixme';
		console.log("700 ", submittingUnit.identifier);
		dispatch(submitUnitEdits(unitId));
		try {
			await unitsApi.edit(submittingUnit);
			dispatch(confirmUnitEdits(unitId));
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