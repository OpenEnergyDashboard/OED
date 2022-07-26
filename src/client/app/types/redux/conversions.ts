/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

export interface RequestConversionsDetailsAction {
	type: ActionType.RequestConversionsDetails;
}

export interface ReceiveConversionsDetailsAction {
	type: ActionType.ReceiveConversionsDetails;
	data: ConversionData[];
}

export interface ChangeDisplayedConversionsAction {
	type: ActionType.ChangeDisplayedConversions;
	selectedConversions: number[];
}

export interface ConfirmEditedConversionAction {
	type: ActionType.ConfirmEditedConversion;
	editedConversion: ConversionData;
}

export interface DeleteSubmittedConversionAction {
	type: ActionType.DeleteSubmittedConversion;
	sourceId: number;
	destinationId: number;

}

export interface SubmitEditedConversionAction {
	type: ActionType.SubmitEditedConversion;
	sourceId: number;
	destinationId: number;
}

export interface ConfirmConversionsFetchedOnceAction {
	type: ActionType.ConfirmConversionsFetchedOnce;
}

export type ConversionsAction = RequestConversionsDetailsAction
| ReceiveConversionsDetailsAction
| ChangeDisplayedConversionsAction
| ConfirmEditedConversionAction
| DeleteSubmittedConversionAction
| SubmitEditedConversionAction
| ConfirmConversionsFetchedOnceAction;

export interface ConversionData {
	sourceId: number;
	destinationId: number;
	bidirectional: boolean;
	slope: number;
	intercept: number;
	note: string;
}

export interface ConversionEditData {
	sourceId: number;
	destinationId: number;
	bidirectional: boolean;
	slope: number;
	intercept: number;
	note: string;
}

// TODO: Check if we also need to include destinationId in this interface. (would need to rename if only sourceId)
export interface ConversionDataById {
	[sourceId: number]: ConversionData;
}

export interface ConversionsState {
	hasBeenFetchedOnce: boolean,
	isFetching: boolean;
	selectedConversions: number[];
	submitting: number[];
	conversions: ConversionDataById;	// See above TODO about potential name change
}
