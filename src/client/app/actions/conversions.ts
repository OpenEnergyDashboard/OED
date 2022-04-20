/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { ActionType, Dispatch, GetState, Thunk } from '../types/redux/actions';
import { ConversionMetaData } from '../types/redux/conversions';
import { State } from '../types/redux/state';
import * as t from '../types/redux/conversions';
import { Conversion } from '../types/items'
import { conversionsApi } from '../utils/api';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import translate from '../utils/translate';
import { logToServer } from './logs';

function requestConversionDetails(): t.RequestConversionDetailsAction {
    return { type: ActionType.RequestConversionDetails };
}

function receiveConversionDetails(data: Conversion[]): t.ReceiveConversionDetailsAction {
    return { type: ActionType.ReceiveConversionDetails, data }
}

export function editConversionDetails(conversion: Conversion): t.EditConversionDetailsAction {
    return { type: ActionType.EditConversionDetails, conversion};
}

function submitEditedConversion(conversion: ConversionMetaData): t.SubmitEditedConversionAction {
    return{ type: ActionType.SubmitEditedConversion, conversion}
}

function confirmEditedConversion(conversion: ConversionMetaData): t.ConfirmEditedConversionAction {
    return { type: ActionType.ConfirmEditedConversion, conversion}
}

export function fetchConversionDetails(): Thunk {
    return async (dispatch: Dispatch) => {
        dispatch(requestConversionDetails());
        const conversionDetails = await conversionsApi.getAll();
        dispatch(receiveConversionDetails(conversionDetails));
    };
}

export function submitConversionsEdits(): Thunk {
    return async (dispatch: Dispatch, getState: GetState) => {
        getState().conversions.editedConversions.forEach(conversion => {
            const conver = conversion;
            if (getState().conversions.submitting.indexOf(conver) === -1) {
                dispatch(submitConversionEdit(conver));
            }
        });
    };
}

export function submitConversionEdit(conversions: Conversion): Thunk {
    return async (dispatch: Dispatch, getState: GetState) => {
        const submittingConversion = conversions;
        dispatch(submitEditedConversion(submittingConversion));
        try{
            await conversionsApi.editConversion(String(submittingConversion.sourceId),String(submittingConversion.destinationId),submittingConversion.bidirectional,submittingConversion.slope,submittingConversion.intercept,submittingConversion.note);
            dispatch(confirmEditedConversion(submittingConversion));
        } catch (err) {
            showErrorNotification(translate('failed.to.edit.conversion'));
        }
    };
}

function shouldFetchConversionDetails(state: State): boolean {
    return !state.conversions.isFetching && _.size(state.conversions.conversion) === 0;
}

export function fetchConversionDetailsIfNeeded(alwaysFetch?: boolean): Thunk {
    return (dispatch: Dispatch, getState: GetState) => {
        if (alwaysFetch || shouldFetchConversionDetails(getState())) {
            return dispatch(fetchConversionDetails());
        }
        return Promise.resolve();
    }
}

function deleteConversion(conversion: Conversion): t.DeleteConversionAction {
    return { type: ActionType.DeleteConversion, conversion};
}

export function removeConversion(conversion: Conversion): Thunk {
    return async (dispatch: Dispatch) => {
        try { 
            await conversionsApi.deleteConversion(String(conversion.sourceId),String(conversion.destinationId));
            dispatch(deleteConversion(conversion));
            dispatch(logToServer('info',`Delete conversion, note = ${conversion.note}`));
            showSuccessNotification(translate('conversion.is.deleted'));
        } catch (err) {
            showErrorNotification(translate('conversion.failed.to.delete'));
            dispatch(logToServer('error',`Failed to delete conversion note = ${conversion.note}`));
        }
    }
}