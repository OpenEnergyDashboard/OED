/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { ActionType, Dispatch, GetState, Thunk } from '../types/redux/actions';
import { MeterMetadata } from '../types/redux/meters';
import { State } from '../types/redux/state';
import * as t from '../types/redux/meters';
import { NamedIDItem } from '../types/items';
import { metersApi } from '../utils/api';
import { showErrorNotification } from '../utils/notifications';
import translate from '../utils/translate';

export function requestMetersDetails(): t.RequestMetersDetailsAction {
	return { type: ActionType.RequestMetersDetails };
}

export function receiveMetersDetails(data: NamedIDItem[]): t.ReceiveMetersDetailsAction {
	return { type: ActionType.ReceiveMetersDetails, data };
}

export function changeDisplayedMeters(meters: number[]): t.ChangeDisplayedMetersAction {
	return { type: ActionType.ChangeDisplayedMeters, selectedMeters: meters};
}

export function editMeterDetails(meter: MeterMetadata):
	t.EditMeterDetailsAction {
	return { type: ActionType.EditMeterDetails, meter };
}

export function submitMeterEdits(meter: number): t.SubmitEditedMeterAction {
	return { type: ActionType.SubmitEditedMeter, meter };
}

export function confirmMeterEdits(meter: number): t.ConfirmEditedMeterAction {
	return { type: ActionType.ConfirmEditedMeter, meter};
}

export function fetchMetersDetails(): Thunk {
	return async (dispatch: Dispatch) => {
		dispatch(requestMetersDetails());
		const metersDetails = await metersApi.details();
		dispatch(receiveMetersDetails(metersDetails));
	};
}

export function submitEditedMeters(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		Object.keys(getState().meters.editedMeters).forEach(meterIdS => {
			const meterId = parseInt(meterIdS);
			if (getState().meters.submitting.indexOf(meterId) === -1) {
				dispatch(submitEditedMeter(meterId));
			}
		});
	};
}

export function submitEditedMeter(meterId: number): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		const submittingMeter = getState().meters.editedMeters[meterId];
		dispatch(submitMeterEdits(meterId));
		try {
			await metersApi.edit(submittingMeter);
			dispatch(confirmMeterEdits(meterId));
		} catch (err) {
			showErrorNotification(translate('failed.to.edit.meter'));
		}
	};
}

export function confirmEditedMeters(): Thunk {
	return async (dispatch: Dispatch, getState: GetState) => {
		Object.keys(getState().meters.editedMeters).forEach(meterIdS => {
			const meterId = parseInt(meterIdS);
			dispatch(confirmMeterEdits(meterId));
		});
	}
}

/**
 * @param {State} state
 */
function shouldFetchMetersDetails(state: State): boolean {
	return !state.meters.isFetching && _.size(state.meters.byMeterID) === 0;
}

export function fetchMetersDetailsIfNeeded(alwaysFetch?: boolean): Thunk {
	return (dispatch: Dispatch, getState: GetState) => {
		if (alwaysFetch || shouldFetchMetersDetails(getState())) {
			return dispatch(fetchMetersDetails());
		}
		return Promise.resolve();
	};
}
