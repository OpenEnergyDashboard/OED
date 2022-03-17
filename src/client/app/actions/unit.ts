import {ActionType, Dispatch, GetState, Thunk} from '../types/redux/actions';
import * as t from '../types/redux/unit'
import {unitsApi} from '../utils/api';
import { NamedIDItem } from '../types/items';
import { UnitData } from '../types/redux/unit';
import { showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';
import { State } from '../types/redux/state';
import * as _ from 'lodash';

function requestUnitsDetails(): t.RequestUnitsDetailsAction {
    return { type: ActionType.RequestUnitsDetails}
}

function receiveUnitsDetails(data: NamedIDItem[]): t.ReceiveUnitsDetailsAction{
    return {type: ActionType.ReceiveUnitsDetails, data}
} 

export function changeDisplayedUnits(units: number[]): t.ChangeDisplayedUnitsAction {
	return { type: ActionType.ChangeDisplayedUnits, selectedUnits: units};
}

export function editUnitDetails(unit: UnitData):
	t.EditUnitDetailsAction {
	return { type: ActionType.EditUnitDetails, unit };
}

export function submitUnitEdits(unit: number): t.SubmitEditedUnitAction {
	return { type: ActionType.SubmitEditedUnit, unit };
}

export function confirmUnitEdits(unit: number): t.ConfirmEditedUnitAction {
	return { type: ActionType.ConfirmEditedUnit, unit};
}

export function fetchUnitsDetails(): Thunk{
    return async (dispatch: Dispatch) => {
        dispatch(requestUnitsDetails());
        const unitsDetails = await unitsApi.details();
        dispatch(receiveUnitsDetails(unitsDetails));
    }
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
		const submittingUnit = getState().units.editedUnits[unitId];
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
 * Remove all the meters in editing without submitting them
 */
 export function confirmEditedUnits(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		Object.keys(getState().units.editedUnits).forEach(unitIdS => {
			const unitId = parseInt(unitIdS);
			dispatch(confirmUnitEdits(unitId));
		});
	}
}

/**
 * @param {State} state
 */
function shouldFetchUnitsDetails(state: State): boolean {
	return !state.units.isLoading && _.size(state.units.byUnitID) === 0;
}

export function fetchUnitsDetailsIfNeeded(alwaysFetch?: boolean): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (alwaysFetch || shouldFetchUnitsDetails(getState())) {
			return dispatch(fetchUnitsDetails());
		}
		return Promise.resolve();
	};
}