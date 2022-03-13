import {ActionType, Dispatch, Thunk, GetState} from '../types/redux/actions';
import * as t from '../types/redux/unit'
import {unitsApi} from '../utils/api';
import { NamedIDItem } from '../types/items';
import { showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';

function requestUnitsDetails(): t.RequestUnitsDetailsAction {
    return { type: ActionType.RequestUnitsDetails}
}

function receiveUnitsDetails(data: NamedIDItem[]): t.ReceiveUnitsDetailsAction{
    return {type: ActionType.ReceiveUnitsDetails, data}
} 

export function confirmUnitEdits(unit: number): t.ConfirmEditedUnitAction {
	return { type: ActionType.ConfirmEditedUnit, unit};
}

export function submitUnitEdits(unit: number): t.SubmitEditedUnitAction {
	return { type: ActionType.SubmitEditedUnit, unit };
}

export function confirmEditedUnits(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		Object.keys(getState().units.editedUnits).forEach(unitIdS => {
			const unitId = parseInt(unitIdS);
			dispatch(confirmUnitEdits(unitId));
		});
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

export function fetchUnitsDetails(): Thunk{
    return async (dispatch: Dispatch) => {
        dispatch(requestUnitsDetails());
        const unitsDetails = await unitsApi.details();
        dispatch(receiveUnitsDetails(unitsDetails));
    }
}