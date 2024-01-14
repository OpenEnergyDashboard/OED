/* This Source Code Form is subject to the terms of the Mozilla Public
	* License, v. 2.0. If a copy of the MPL was not distributed with this
	* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO Marked For Deletion after RTK migration solidified
/* eslint-disable jsdoc/check-param-names */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
/* eslint-disable jsdoc/require-param */

import { Thunk, Dispatch, GetState } from '../../types/redux/actions';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import * as t from '../../types/redux/units';
import { unitsApi } from '../../utils/api';
import { updateCikAndDBViewsIfNeeded } from './admin';
import { unitsSlice } from '../reducers/units';


export function fetchUnitsDetails(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// ensure a fetch is not currently happening
		if (!getState().units.isFetching) {
			// set isFetching to true
			dispatch(unitsSlice.actions.requestUnitsDetails());
			// attempt to retrieve units details from database
			const units = await unitsApi.getUnitsDetails();
			// update the state with the units details and set isFetching to false
			dispatch(unitsSlice.actions.receiveUnitsDetails(units));
			// If this is the first fetch, inform the store that the first fetch has been made
			if (!getState().units.hasBeenFetchedOnce) {
				dispatch(unitsSlice.actions.confirmUnitsFetchedOnce());
			}
		}
	}
}

// Fetch the units details from the database if they have not already been fetched once
export function fetchUnitsDetailsIfNeeded(): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		// If units have not been fetched once, return the fetchUnitDetails function
		if (!getState().units.hasBeenFetchedOnce) {
			return dispatch(fetchUnitsDetails());
		}
		// If units have already been fetched, return a resolved promise
		return Promise.resolve();
	};
}

export function submitEditedUnit(editedUnit: t.UnitData, shouldRedoCik: boolean, shouldRefreshReadingViews: boolean): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		// check if unitData is already submitting (indexOf returns -1 if item does not exist in array)
		if (getState().units.submitting.indexOf(editedUnit.id) === -1) {
			// Inform the store we are about to edit the passed in unit
			// Pushes unitId of the unitData to submit onto the submitting state array
			dispatch(unitsSlice.actions.submitEditedUnit(editedUnit.id));

			// Attempt to edit the unit in the database
			try {
				// posts the edited unitData to the units API
				await unitsApi.edit(editedUnit);
				dispatch(updateCikAndDBViewsIfNeeded(shouldRedoCik, shouldRefreshReadingViews));
				// Update the store with our new edits
				dispatch(unitsSlice.actions.confirmEditedUnit(editedUnit));
				// Success!
				showSuccessNotification(translate('unit.successfully.edited.unit'));
			} catch (err) {
				// Failure! ):
				showErrorNotification(translate('unit.failed.to.edit.unit'));
			}
			// Clear unit Id from submitting state array
			dispatch(unitsSlice.actions.confirmUnitEdits(editedUnit.id));
		}
	};
}

// Add unit to database
export function addUnit(unit: t.UnitData): Thunk {
	return async (dispatch: Dispatch) => {
		try {
			// Attempt to add unit to database
			await unitsApi.addUnit(unit);
			// Adding a new unit only affects the Cik table
			dispatch(updateCikAndDBViewsIfNeeded(true, false));
			showSuccessNotification(translate('unit.successfully.create.unit'));
		} catch (err) {
			showErrorNotification(translate('unit.failed.to.create.unit'));
		}
	}
}