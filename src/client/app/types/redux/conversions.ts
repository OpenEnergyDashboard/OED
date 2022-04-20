/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';
import { Conversion, ConversionBidirectional } from '../items';

export interface RequestConversionDetailsAction {
    type: ActionType.RequestConversionDetails;
}

export interface ReceiveConversionDetailsAction {
    type: ActionType.ReceiveConversionDetails;
    data: Conversion[];
}

export interface EditConversionDetailsAction {
    type: ActionType.EditConversionDetails;
    conversion: Conversion;
}

export interface SubmitEditedConversionAction {
    type: ActionType.SubmitEditedConversion;
    conversion: Conversion;
}

export interface ConfirmEditedConversionAction {
    type: ActionType.ConfirmEditedConversion;
    conversion: Conversion;
}

export interface DeleteConversionAction {
    type: ActionType.DeleteConversion;
    conversion: Conversion
}

export type ConversionActions = 
        | RequestConversionDetailsAction
        | ReceiveConversionDetailsAction
        | EditConversionDetailsAction
        | ConfirmEditedConversionAction
        | SubmitEditedConversionAction
        | DeleteConversionAction;

export interface ConversionEditData {
    bidirectional: ConversionBidirectional;
	slope: number;
	intercept: number;
	note: string;
}

export interface ConversionMetaData {
    sourceId: number;
	destinationId: number;
	bidirectional: ConversionBidirectional;
	slope: number;
	intercept: number;
	note: string;
}

export interface ConversionsState {
    isFetching: boolean;
    conversion: Conversion[];
    editedConversions: Conversion[];
    submitting: Conversion[];
}
